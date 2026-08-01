"""
Serviço de extração de documentos do Blink.

Um endpoint só: recebe o ponteiro de um arquivo já no bucket `imports`, extrai
texto/figuras/posições, grava tudo de volta no mesmo diretório do job e devolve
os números. Quem chama é a Edge Function `generate-cards` — este serviço não
fala com o app nem com a IA.

    POST /extract
    x-extractor-token: <segredo compartilhado>
    { "user_id": "...", "job_id": "...", "source_path": "...", "mime": "..." }

    → { "bundle_path": "<user>/<job>/bundle.json", "stats": { ... } }
"""

from __future__ import annotations

import json
import os
import secrets

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

import storage
from extract import UnsupportedFormat, extract, thumbnail

BUCKET = os.environ.get("IMPORTS_BUCKET", "imports")
EXTRACTOR_TOKEN = os.environ.get("EXTRACTOR_TOKEN", "")
# Teto de segurança: PDF gigante derruba o container por memória antes de
# qualquer coisa útil acontecer.
MAX_SOURCE_BYTES = int(os.environ.get("MAX_SOURCE_MB", "40")) * 1024 * 1024

app = FastAPI(title="Blink extractor", docs_url=None, redoc_url=None)


class ExtractRequest(BaseModel):
    user_id: str = Field(min_length=1)
    job_id: str = Field(min_length=1)
    source_path: str = Field(min_length=1)
    mime: str = ""
    filename: str = ""


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _authorize(token: str | None) -> None:
    if not EXTRACTOR_TOKEN:
        raise HTTPException(500, "EXTRACTOR_TOKEN não configurado no serviço.")
    # Comparação em tempo constante: o token é o único portão daqui.
    if not token or not secrets.compare_digest(token, EXTRACTOR_TOKEN):
        raise HTTPException(401, "token inválido")


@app.post("/extract")
def extract_document(
    body: ExtractRequest,
    x_extractor_token: str | None = Header(default=None),
) -> dict[str, object]:
    _authorize(x_extractor_token)

    # O caminho tem de estar dentro da pasta do próprio usuário. A service role
    # ignora RLS, então esta checagem é a que impede um job apontar para o
    # arquivo de outra conta.
    prefix = f"{body.user_id}/"
    if not body.source_path.startswith(prefix) or ".." in body.source_path:
        raise HTTPException(400, "source_path fora da pasta do usuário")

    try:
        data = storage.download(BUCKET, body.source_path)
    except storage.StorageError as e:
        raise HTTPException(502, f"não consegui ler o arquivo: {e}") from e

    if len(data) > MAX_SOURCE_BYTES:
        raise HTTPException(413, "arquivo grande demais")

    try:
        bundle = extract(data, body.mime, body.filename or body.source_path)
    except UnsupportedFormat as e:
        raise HTTPException(415, f"formato não suportado: {e}") from e
    except Exception as e:  # PDF corrompido, protegido por senha, etc.
        raise HTTPException(422, f"não consegui ler o documento: {e}") from e

    folder = f"{body.user_id}/{body.job_id}"
    payload = bundle.to_json()

    # Sobe só as figuras que passaram no filtro — as descartadas ficam
    # registradas no bundle (com o motivo), mas não ocupam espaço no bucket.
    # Duas versões: a grande vira imagem do card, a pequena vai no prompt.
    for image in bundle.images:
        if not image.candidate:
            continue
        storage.upload(BUCKET, f"{folder}/{image.path}", image.data, "image/jpeg")
        storage.upload(
            BUCKET, f"{folder}/{image.thumb_path}", thumbnail(image.data), "image/jpeg"
        )

    bundle_path = f"{folder}/bundle.json"
    storage.upload(
        BUCKET,
        bundle_path,
        json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        "application/json",
    )

    return {"bundle_path": bundle_path, "stats": payload["stats"]}
