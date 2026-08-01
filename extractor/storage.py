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


def upload(bucket: str, path: str, data: bytes, content_type: str) -> None:
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    headers = {
        **_headers(),
        "Content-Type": content_type,
        # Reprocessar o mesmo job não pode falhar por arquivo já existente.
        "x-upsert": "true",
    }
    with httpx.Client(timeout=TIMEOUT) as client:
        response = client.post(url, headers=headers, content=data)
    if response.status_code not in (200, 201):
        raise StorageError(
            f"upload falhou ({response.status_code}) em {bucket}/{path}: "
            f"{response.text[:200]}"
        )
