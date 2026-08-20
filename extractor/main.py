"""
Serviço de extração de documentos do Blink.

Um endpoint só: recebe o ponteiro de um arquivo já no bucket `imports`, roteia
pelo formato, extrai texto/figuras/posições, grava tudo de volta no mesmo
diretório do job e devolve os números. Quem chama é a Edge Function
`generate-cards-doc` — este serviço não fala com o app nem com a IA.

    POST /extract
    x-extractor-token: <segredo compartilhado>
    { "user_id": "...", "job_id": "...", "source_path": "...", "mime": "..." }

    → { "bundle_path": "<user>/<job>/bundle.json", "stats": {...}, "warnings": [...] }

Formatos: PDF, PPTX, DOCX e imagem solta. Ver `extractors/__init__.py`.
"""

from __future__ import annotations

import json
import os
import secrets
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

import storage
from extractors import Options, UnsupportedFormat, extract, thumbnail

BUCKET = os.environ.get("IMPORTS_BUCKET", "imports")
EXTRACTOR_TOKEN = os.environ.get("EXTRACTOR_TOKEN", "")
# Teto de segurança: arquivo gigante derruba o container por memória antes de
# qualquer coisa útil acontecer. Alinhado com o limite que o app aplica na
# seleção (`components/AiGeneratorForm.tsx`) — barrar no cliente é gentileza,
# barrar aqui é o que vale.
MAX_SOURCE_BYTES = int(os.environ.get("MAX_SOURCE_MB", "25")) * 1024 * 1024

app = FastAPI(title="Blink extractor", docs_url=None, redoc_url=None)


class ExtractRequest(BaseModel):
    user_id: str = Field(min_length=1)
    job_id: str = Field(min_length=1)
    source_path: str = Field(min_length=1)
    mime: str = ""
    filename: str = ""
    # PDF digitalizado: renderizar cada página como imagem. Só serve quando há
    # IA adiante para LER as páginas — por isso vem desligado.
    render_scanned_pages: bool = False
    # Tabelas em markdown: a parte mais cara do PDF, e só o prompt da geração
    # usa. O preview desliga para responder rápido.
    extract_tables: bool = True
    # Procurar figuras. Desligado quando o usuário diz que o material não tem
    # figura aproveitável: pula leitura, normalização e upload das imagens.
    extract_images: bool = True
    # Miniaturas (versão 900px de cada figura): só o prompt da geração usa.
    # No preview elas dobravam o número de uploads — e o upload, a ~0,7s de
    # ida e volta cada, é onde o tempo do job realmente mora.
    thumbnails: bool = True


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _authorize(token: Optional[str]) -> None:
    if not EXTRACTOR_TOKEN:
        raise HTTPException(500, "EXTRACTOR_TOKEN não configurado no serviço.")
    # Comparação em tempo constante: o token é o único portão daqui.
    if not token or not secrets.compare_digest(token, EXTRACTOR_TOKEN):
        raise HTTPException(401, "token inválido")


@app.post("/extract")
def extract_document(
    body: ExtractRequest,
    # `Optional[str]` em vez de `str | None`: o FastAPI avalia a assinatura em
    # tempo de execução, e a sintaxe nova só existe do Python 3.10 em diante. O
    # container roda 3.12, mas assim dá para subir local no Python do sistema.
    x_extractor_token: Optional[str] = Header(default=None),
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
        bundle = extract(
            data,
            body.mime,
            body.filename or body.source_path,
            Options(
                render_scanned_pages=body.render_scanned_pages,
                extract_tables=body.extract_tables,
                extract_images=body.extract_images,
            ),
        )
    except UnsupportedFormat as e:
        # 415 carrega a mensagem pronta para o usuário ("PowerPoint antigo
        # (.ppt) ainda não é suportado. Exporte como..."), então a Edge Function
        # repassa em vez de inventar texto próprio.
        raise HTTPException(415, str(e)) from e
    except Exception as e:  # arquivo corrompido, protegido por senha, etc.
        raise HTTPException(422, f"não consegui ler o documento: {e}") from e

    folder = f"{body.user_id}/{body.job_id}"
    payload = bundle.to_json()

    # Sobe só as figuras que passaram no filtro — as descartadas ficam
    # registradas no bundle (com o motivo), mas não ocupam espaço no bucket.
    # Duas versões: a grande vira imagem do card, a pequena vai no prompt.
    # Em lote paralelo: são centenas de objetos por job, e um por um estourava
    # o tempo de resposta (ver `storage.upload_many`).
    uploads: list[tuple[str, bytes, str]] = []
    for image in bundle.images:
        if not image.candidate:
            continue
        uploads.append((f"{folder}/{image.path}", image.data, "image/jpeg"))
        if body.thumbnails:
            uploads.append(
                (f"{folder}/{image.thumb_path}", thumbnail(image.data), "image/jpeg")
            )

    bundle_path = f"{folder}/bundle.json"
    uploads.append(
        (
            bundle_path,
            json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            "application/json",
        )
    )
    # 16 por vez: são objetos de ~20 KB, o custo é quase todo latência de rede —
    # mais paralelismo é quase de graça até o limite de conexões do Storage.
    storage.upload_many(BUCKET, uploads, workers=16)

    return {
        "bundle_path": bundle_path,
        "stats": payload["stats"],
        "warnings": payload["warnings"],
    }
