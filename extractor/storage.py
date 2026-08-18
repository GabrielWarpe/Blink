"""
Cliente mínimo do Supabase Storage.

A API REST do Storage é simples o bastante para não justificar o SDK inteiro
como dependência de um container que só precisa baixar um arquivo e subir
algumas imagens. Autentica com a SERVICE ROLE, então roda por cima da RLS —
o caminho sempre começa com o `user_id` do dono, montado por quem chama.
"""

from __future__ import annotations

import os

import httpx

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

TIMEOUT = httpx.Timeout(60.0, connect=10.0)


class StorageError(RuntimeError):
    pass


def _headers() -> dict[str, str]:
    if not SUPABASE_URL or not SERVICE_ROLE_KEY:
        raise StorageError(
            "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar no ambiente."
        )
    return {
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "apikey": SERVICE_ROLE_KEY,
    }


def download(bucket: str, path: str) -> bytes:
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    with httpx.Client(timeout=TIMEOUT) as client:
        response = client.get(url, headers=_headers())
    if response.status_code != 200:
        raise StorageError(
            f"download falhou ({response.status_code}) em {bucket}/{path}: "
            f"{response.text[:200]}"
        )
    return response.content


def upload(
    bucket: str,
    path: str,
    data: bytes,
    content_type: str,
    client: httpx.Client | None = None,
) -> None:
    """Sobe um objeto. Passe `client` para reaproveitar a conexão em lote."""
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    headers = {
        **_headers(),
        "Content-Type": content_type,
        # Reprocessar o mesmo job não pode falhar por arquivo já existente.
        "x-upsert": "true",
    }
    if client is not None:
        response = client.post(url, headers=headers, content=data)
    else:
        with httpx.Client(timeout=TIMEOUT) as one_shot:
            response = one_shot.post(url, headers=headers, content=data)
    if response.status_code not in (200, 201):
        raise StorageError(
            f"upload falhou ({response.status_code}) em {bucket}/{path}: "
            f"{response.text[:200]}"
        )


def upload_many(bucket: str, items: list[tuple[str, bytes, str]], workers: int = 8) -> None:
    """
    Sobe vários objetos em paralelo, reaproveitando conexões.

    Existe porque um job real sobe centenas de arquivos (figura + miniatura de
    cada), e um por um — cada qual abrindo TLS do zero — levava mais tempo que a
    extração inteira: foi o que estourou o teto de 100 s do túnel de
    desenvolvimento. Oito por vez com conexão reaproveitada resolve com folga, e
    o Storage aguenta esse paralelismo sem reclamar.
    """
    from concurrent.futures import ThreadPoolExecutor

    limits = httpx.Limits(max_connections=workers, max_keepalive_connections=workers)
    with httpx.Client(timeout=TIMEOUT, limits=limits) as client:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = [
                pool.submit(upload, bucket, path, data, content_type, client)
                for path, data, content_type in items
            ]
            # `result()` propaga a primeira exceção — melhor falhar o job do que
            # devolver um bundle que aponta para figuras que não subiram.
            for future in futures:
                future.result()
