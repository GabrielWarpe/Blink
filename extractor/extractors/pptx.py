"""
PPTX — o formato mais importante para o Blink.

Slide de aula é o material que o aluno mais tem em mãos e o mais rico em figuras,
e o mapeamento é natural: um slide é uma página, e a figura já vem pronta em
`ppt/media/`. Nada de decodificar bitmap na mão como no PDF.

Duas decisões que valem o trabalho extra:
  • a ordem dos slides sai de `p:sldIdLst`, não do número no nome do arquivo —
    reordenar slides no PowerPoint não renomeia as partes;
  • cada figura é amarrada ao slide certo pelos `_rels`, então a Fase 2 sabe de
    que slide veio a imagem, que é o que permite escolher a figura pelo assunto.
"""

from __future__ import annotations

import zipfile
from typing import Any
from xml.etree import ElementTree

from .base import MAX_PAGES, MAX_RAW_IMAGES, Bundle, ExtractedImage, Options
from .imaging import apply_filter, digest, normalize, postprocess
from . import ooxml
from .ooxml import NS, R_EMBED, R_ID

A_T = f"{{{NS['a']}}}t"
A_P = f"{{{NS['a']}}}p"
A_BLIP = f"{{{NS['a']}}}blip"

PRESENTATION = "ppt/presentation.xml"


class PptxExtractor:
    def handles(self, mime: str, filename: str) -> bool:
        return (
            mime
            == "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            or filename.lower().endswith(".pptx")
        )

    def extract(self, data: bytes, filename: str, opts: Options) -> Bundle:
        return extract_pptx(data, opts)


def extract_pptx(data: bytes, opts: Options | None = None) -> Bundle:
    opts = opts or Options()
    zf = ooxml.open_zip(data)
    try:
        slides = _slide_parts(zf)
        total = len(slides)
        limit = min(total, MAX_PAGES)

        pages: list[dict[str, Any]] = []
        images: list[ExtractedImage] = []
        # A mesma mídia costuma aparecer em vários slides (logo, fundo). Guardar
        # o resultado da normalização evita reprocessar o mesmo JPEG 40 vezes.
        cache: dict[str, tuple[bytes, int, int] | None] = {}
        next_id = 1

        for index in range(limit):
            part = slides[index]
            number = index + 1
            root = ooxml.parse_xml(zf, part)

            text = _slide_text(root)
            notes = _notes_text(zf, part)
            if notes:
                text = f"{text}\n\n[notas do apresentador]\n{notes}".strip()

            page_images: list[int] = []
            midias = _slide_media(zf, part, root) if opts.extract_images else []
            for order, media in enumerate(midias):
                if len(images) >= MAX_RAW_IMAGES:
                    break
                if media not in cache:
                    raw = ooxml.read_media(zf, media)
                    cache[media] = normalize(raw) if raw else None
                normalized = cache[media]
                if normalized is None:
                    continue

                blob, width, height = normalized
                item = ExtractedImage(
                    id=next_id,
                    page=number,
                    order=order,
                    data=blob,
                    width=width,
                    height=height,
                    sha256=digest(blob),
                    kind="embedded",
                )
                # Sem geometria de página confiável aqui, o filtro roda só com
                # lado, proporção e cor chapada — o descarte de logo repetido
                # entre slides é feito pelo `postprocess`, e nesse formato é ele
                # que faz o trabalho pesado.
                apply_filter(item)
                images.append(item)
                page_images.append(next_id)
                next_id += 1

            pages.append(
                {"page": number, "text": text, "tables": [], "images": page_images}
            )

        bundle = Bundle(
            source={
                "type": "pptx",
                "pages": total,
                "scanned": False,
                "title": _title(zf),
            },
            pages=pages,
            images=images,
        )

        postprocess(bundle)

        if total > limit:
            bundle.warn("limite_paginas")
        if not bundle.candidates:
            bundle.warn("sem_imagens")
        if not any(p["text"] for p in pages):
            bundle.warn("sem_texto")

        return bundle
    finally:
        zf.close()


def _slide_parts(zf: zipfile.ZipFile) -> list[str]:
    """Slides na ordem da apresentação, não na ordem do nome do arquivo."""
    root = ooxml.parse_xml(zf, PRESENTATION)
    if root is not None:
        rels = ooxml.relationships(zf, PRESENTATION)
        lst = root.find("p:sldIdLst", NS)
        if lst is not None:
            ordered = [
                rels[rid]
                for node in lst.findall("p:sldId", NS)
                if (rid := node.get(R_ID)) and rid in rels
            ]
            if ordered:
                return ordered

    # Apresentação sem `sldIdLst` legível: cai para a ordem natural dos nomes.
    return [
        n
        for n in sorted(zf.namelist(), key=ooxml.natural_key)
        if n.startswith("ppt/slides/slide") and n.endswith(".xml")
    ]


def _slide_text(root: ElementTree.Element | None) -> str:
    """Um parágrafo por linha — é assim que o texto do slide se lê."""
    if root is None:
        return ""
    lines = []
    for para in root.iter(A_P):
        line = "".join(t.text or "" for t in para.iter(A_T)).strip()
        if line:
            lines.append(line)
    return "\n".join(lines)


def _notes_text(zf: zipfile.ZipFile, part: str) -> str:
    """
    Notas do apresentador. Costumam ser o melhor material de estudo do arquivo:
    é onde mora a explicação que o slide só resume em tópicos.
    """
    for target in ooxml.relationships(zf, part).values():
        if "notesSlide" in target:
            return _slide_text(ooxml.parse_xml(zf, target))
    return ""


def _slide_media(
    zf: zipfile.ZipFile, part: str, root: ElementTree.Element | None
) -> list[str]:
    """Caminhos das figuras deste slide, na ordem em que aparecem no XML."""
    if root is None:
        return []
    rels = ooxml.relationships(zf, part)
    out: list[str] = []
    for blip in root.iter(A_BLIP):
        target = rels.get(blip.get(R_EMBED) or "")
        if target and ooxml.is_media(target) and target not in out:
            out.append(target)
    return out


def _title(zf: zipfile.ZipFile) -> str | None:
    root = ooxml.parse_xml(zf, "docProps/core.xml")
    if root is None:
        return None
    node = root.find("{http://purl.org/dc/elements/1.1/}title")
    return (node.text or "").strip() or None if node is not None else None
