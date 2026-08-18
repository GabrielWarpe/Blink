"""
DOCX — Word.

Mais simples que o PDF pelo mesmo motivo do PPTX: as figuras já estão prontas em
`word/media/`. A diferença é que o Word não tem paginação no XML (a quebra de
página só existe quando o editor renderiza), então tudo vira uma pseudo-página
única. É honesto: melhor uma página só do que inventar numeração que não bate
com o que o aluno vê na tela.
"""

from __future__ import annotations

import zipfile
from typing import Any
from xml.etree import ElementTree

from .base import MAX_RAW_IMAGES, Bundle, ExtractedImage, Options
from .imaging import apply_filter, digest, normalize, postprocess
from . import ooxml
from .ooxml import NS, R_EMBED, R_ID

DOCUMENT = "word/document.xml"
MEDIA_PREFIX = "word/media/"

W_P = f"{{{NS['w']}}}p"
W_TBL = f"{{{NS['w']}}}tbl"
W_TR = f"{{{NS['w']}}}tr"
W_TC = f"{{{NS['w']}}}tc"
W_T = f"{{{NS['w']}}}t"
A_BLIP = f"{{{NS['a']}}}blip"
# Word antigo guarda figura como VML em vez de DrawingML; sem isto some figura
# de documento gerado por editor legado.
V_IMAGEDATA = "{urn:schemas-microsoft-com:vml}imagedata"


class DocxExtractor:
    def handles(self, mime: str, filename: str) -> bool:
        return (
            mime
            == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            or filename.lower().endswith(".docx")
        )

    def extract(self, data: bytes, filename: str, opts: Options) -> Bundle:
        return extract_docx(data)


def extract_docx(data: bytes) -> Bundle:
    zf = ooxml.open_zip(data)
    try:
        root = ooxml.parse_xml(zf, DOCUMENT)
        body = root.find("w:body", NS) if root is not None else None

        text, tables = _read_body(body)
        images = _read_images(zf, root)

        pages: list[dict[str, Any]] = [
            {
                "page": 1,
                "text": text,
                "tables": tables,
                "images": [i.id for i in images],
            }
        ]

        bundle = Bundle(
            source={
                "type": "docx",
                "pages": 1,
                "scanned": False,
                "title": _title(zf),
            },
            pages=pages,
            images=images,
        )

        postprocess(bundle)

        if not bundle.candidates:
            bundle.warn("sem_imagens")
        if not text:
            bundle.warn("sem_texto")

        return bundle
    finally:
        zf.close()


def _read_body(body: ElementTree.Element | None) -> tuple[str, list[str]]:
    """Texto na ordem do documento; tabelas à parte, em markdown."""
    if body is None:
        return "", []

    lines: list[str] = []
    tables: list[str] = []
    for node in body:
        if node.tag == W_P:
            line = "".join(t.text or "" for t in node.iter(W_T)).strip()
            if line:
                lines.append(line)
        elif node.tag == W_TBL:
            md = _table_markdown(node)
            if md:
                tables.append(md)
                # Marcador no fluxo do texto: sem ele a tabela perde o lugar em
                # que aparecia, e a Fase 2 não sabe a que trecho ela pertence.
                lines.append(f"[tabela {len(tables)}]")
    return "\n".join(lines), tables


def _table_markdown(table: ElementTree.Element) -> str:
    rows: list[list[str]] = []
    for tr in table.iter(W_TR):
        cells = [
            " ".join("".join(t.text or "" for t in tc.iter(W_T)).split())
            for tc in tr.iter(W_TC)
        ]
        if any(cells):
            rows.append(cells)
    if not rows:
        return ""

    width = max(len(r) for r in rows)
    rows = [r + [""] * (width - len(r)) for r in rows]
    head, *rest = rows
    out = ["| " + " | ".join(head) + " |", "|" + "---|" * width]
    out += ["| " + " | ".join(r) + " |" for r in rest]
    return "\n".join(out)


def _read_images(
    zf: zipfile.ZipFile, root: ElementTree.Element | None
) -> list[ExtractedImage]:
    """
    Figuras na ordem em que aparecem no documento, e depois as que estão no
    pacote mas não foram citadas — nenhuma figura pode sumir por causa de um
    esquema de referência que este código não conheça.
    """
    rels = ooxml.relationships(zf, DOCUMENT) if root is not None else {}

    ordered: list[str] = []
    if root is not None:
        for node in root.iter():
            rid = (
                node.get(R_EMBED)
                if node.tag == A_BLIP
                else node.get(R_ID)
                if node.tag == V_IMAGEDATA
                else None
            )
            target = rels.get(rid or "")
            if target and ooxml.is_media(target) and target not in ordered:
                ordered.append(target)

    for name in ooxml.media_members(zf, MEDIA_PREFIX):
        if name not in ordered:
            ordered.append(name)

    out: list[ExtractedImage] = []
    for order, name in enumerate(ordered[:MAX_RAW_IMAGES]):
        raw = ooxml.read_media(zf, name)
        normalized = normalize(raw) if raw else None
        if normalized is None:
            continue
        blob, width, height = normalized
        item = ExtractedImage(
            id=len(out) + 1,
            page=1,
            order=order,
            data=blob,
            width=width,
            height=height,
            sha256=digest(blob),
            kind="embedded",
        )
        apply_filter(item)
        out.append(item)
    return out


def _title(zf: zipfile.ZipFile) -> str | None:
    root = ooxml.parse_xml(zf, "docProps/core.xml")
    if root is None:
        return None
    node = root.find("{http://purl.org/dc/elements/1.1/}title")
    return (node.text or "").strip() or None if node is not None else None
