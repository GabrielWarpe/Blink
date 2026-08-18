"""
Roteador de extração.

Uma função de entrada, um extrator por formato, e SEMPRE a mesma saída — quem
chama nunca precisa saber de que tipo de arquivo o material veio.

Para acrescentar um formato: um módulo novo que implemente o `Extractor` de
`base.py` e uma entrada em `EXTRACTORS`. Nada mais no fluxo muda.
"""

from __future__ import annotations

from .base import (
    MAX_CANDIDATE_IMAGES,
    MAX_PAGES,
    MAX_RAW_IMAGES,
    Bundle,
    ExtractedImage,
    Extractor,
    Options,
    UnsupportedFormat,
)
from .docx import DocxExtractor
from .image_file import ImageExtractor
from .imaging import thumbnail
from .pdf import PdfExtractor
from .pptx import PptxExtractor

# A ordem importa só para desempate; na prática os testes de formato são
# mutuamente exclusivos. PPTX vem cedo porque é o formato prioritário.
EXTRACTORS: tuple[Extractor, ...] = (
    PdfExtractor(),
    PptxExtractor(),
    DocxExtractor(),
    ImageExtractor(),
)

# Formatos que a gente reconhece mas não lê. Existem nesta lista só para dar uma
# mensagem útil em vez de "formato desconhecido" — o aluno com um .ppt de 2003
# precisa saber que a saída é "Salvar como .pptx", não que o app está quebrado.
KNOWN_UNSUPPORTED = {
    ".doc": "Word antigo (.doc)",
    ".ppt": "PowerPoint antigo (.ppt)",
    ".xls": "Excel antigo (.xls)",
    ".odt": "OpenDocument (.odt)",
    ".odp": "OpenDocument (.odp)",
    ".pages": "Pages",
    ".key": "Keynote",
    ".epub": "EPUB",
    ".rtf": "RTF",
    ".txt": "texto puro (.txt)",
}

SUGGESTION = "Exporte como PDF, DOCX ou PPTX e tente de novo."


def extract(
    data: bytes,
    mime: str = "",
    filename: str = "",
    opts: Options | None = None,
) -> Bundle:
    """Roteia pelo formato e devolve o `Bundle` — igual para todos os tipos."""
    mime = (mime or "").split(";")[0].strip().lower()
    filename = filename or ""
    opts = opts or Options()

    for extractor in EXTRACTORS:
        if extractor.handles(mime, filename):
            return extractor.extract(data, filename, opts)

    raise UnsupportedFormat(_describe(mime, filename))


def _describe(mime: str, filename: str) -> str:
    """Mensagem que diz o que veio e o que fazer a respeito."""
    lower = filename.lower()
    for ext, label in KNOWN_UNSUPPORTED.items():
        if lower.endswith(ext):
            return f"{label} ainda não é suportado. {SUGGESTION}"
    identified = mime or (lower.rsplit(".", 1)[-1] if "." in lower else "desconhecido")
    return f"Formato não suportado ({identified}). {SUGGESTION}"


__all__ = [
    "Bundle",
    "ExtractedImage",
    "Extractor",
    "MAX_CANDIDATE_IMAGES",
    "MAX_PAGES",
    "MAX_RAW_IMAGES",
    "Options",
    "UnsupportedFormat",
    "extract",
    "thumbnail",
]
