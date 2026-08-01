"""
Extração determinística de documentos — sem IA.

A IA recebe o resultado disto pronto: texto por página, figuras já recortadas do
arquivo, posição de cada uma e legenda quando existe. O que ela decide é o que
vira card e qual figura ajuda a memorizar — não a leitura do arquivo.

O filtro de figuras também mora aqui, e é a peça que mais economiza: logotipo,
cabeçalho, rodapé e marca d'água têm assinatura determinística (a mesma imagem
repetida em várias páginas), então são descartados de graça em vez de custar
~1.500 tokens cada para a IA concluir "isto é um logo".
"""

from __future__ import annotations

import hashlib
import io
from dataclasses import dataclass, field
from typing import Any

import fitz  # PyMuPDF
from PIL import Image, ImageStat

# ── Limiares do filtro ──────────────────────────────────────────────────────

# Lado menor, em pixels: abaixo disso é ícone, marcador ou ruído.
MIN_SIDE_PX = 100
# Área mínima da figura em relação à página. Figura didática ocupa espaço.
MIN_AREA_RATIO = 0.012
# Faixas muito alongadas são divisórias, réguas e bordas decorativas.
MAX_ASPECT = 8.0
# A mesma imagem em N ou mais páginas é elemento de template, não conteúdo.
REPEAT_PAGE_LIMIT = 3
# Desvio padrão baixo em todos os canais = bloco de cor chapada.
MIN_STDDEV = 8.0

# ── Leitura ─────────────────────────────────────────────────────────────────

# Menos caracteres que isto por página, em média, e o PDF é digitalização: as
# letras estão dentro de uma foto, não no arquivo.
SCANNED_CHARS_PER_PAGE = 60
# Resolução do render de página (só para PDF digitalizado). 150 dpi lê bem sem
# gerar arquivo gigante.
PAGE_RENDER_DPI = 150
# Distância máxima, em pontos, entre a base da figura e a legenda abaixo dela.
CAPTION_GAP_PT = 64
CAPTION_MAX_CHARS = 180

# Lado maior das figuras salvas — mesmo teto do upload manual do app
# (`services/images.ts`), para que a cópia final no `card-images` seja coerente.
MAX_IMAGE_SIDE = 1600
JPEG_QUALITY = 82

# Versão reduzida, usada SÓ no prompt. O custo de visão cresce com a dimensão
# da imagem: 1600px sai por ~1.500 tokens, 900px por menos da metade — e para
# decidir "esta figura ensina isto?" 900px basta. A figura que vira card é
# sempre a grande.
THUMB_SIDE = 900
THUMB_QUALITY = 78


class UnsupportedFormat(Exception):
    """Formato que este serviço ainda não lê (docx, pptx…)."""


@dataclass
class ExtractedImage:
    """Figura encontrada no documento, já normalizada e pronta para subir."""

    id: int
    page: int
    order: int
    data: bytes
    width: int
    height: int
    sha256: str
    bbox: list[float] | None
    caption: str | None
    kind: str  # 'embedded' | 'page'
    candidate: bool = True
    reject_reason: str | None = None

    @property
    def path(self) -> str:
        return f"img/{self.id:04d}.jpg"

    @property
    def thumb_path(self) -> str:
        return f"thumb/{self.id:04d}.jpg"

    def to_json(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "page": self.page,
            "order": self.order,
            "path": self.path,
            "thumb_path": self.thumb_path,
            "bbox": self.bbox,
            "size": [self.width, self.height],
            "caption": self.caption,
            "kind": self.kind,
            "candidate": self.candidate,
            "reject_reason": self.reject_reason,
        }


@dataclass
class Bundle:
    """Resultado completo: o JSON que a IA vai consumir + os bytes a subir."""

    source: dict[str, Any]
    pages: list[dict[str, Any]]
    images: list[ExtractedImage] = field(default_factory=list)

    def to_json(self) -> dict[str, Any]:
        candidates = [i for i in self.images if i.candidate]
        return {
            "source": self.source,
            "pages": self.pages,
            # Catálogo achatado só com o que passou no filtro: é exatamente a
            # lista que vira o prompt, na ordem em que aparece no documento.
            "catalog": [i.to_json() for i in candidates],
            "rejected": [i.to_json() for i in self.images if not i.candidate],
            "stats": {
                "pages": len(self.pages),
                "images_found": len(self.images),
                "images_kept": len(candidates),
                "scanned": self.source.get("scanned", False),
                "chars": sum(len(p.get("text", "")) for p in self.pages),
            },
        }


# ── Normalização de imagem ──────────────────────────────────────────────────


def _normalize(raw: bytes) -> tuple[bytes, int, int] | None:
    """Converte para JPEG RGB com teto de lado. None se não for imagem legível."""
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception:
        return None

    # PDF guarda muita coisa em CMYK/paleta/com canal alfa; JPEG só aceita RGB.
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    largest = max(img.width, img.height)
    if largest > MAX_IMAGE_SIDE:
        scale = MAX_IMAGE_SIDE / largest
        img = img.resize(
            (max(1, round(img.width * scale)), max(1, round(img.height * scale))),
            Image.LANCZOS,
        )

    out = io.BytesIO()
    img.convert("RGB").save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return out.getvalue(), img.width, img.height


def thumbnail(data: bytes) -> bytes:
    """Versão reduzida para o prompt. Falhou? devolve a original."""
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
        img.thumbnail((THUMB_SIDE, THUMB_SIDE), Image.LANCZOS)
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=THUMB_QUALITY, optimize=True)
        return out.getvalue()
    except Exception:
        return data


def _is_flat(data: bytes) -> bool:
    """Bloco de cor chapada (fundo, tarja, separador) — não ensina nada."""
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
        # Amostra pequena basta e evita percorrer imagem grande inteira.
        img.thumbnail((160, 160))
        stddev = ImageStat.Stat(img).stddev
        return max(stddev) < MIN_STDDEV
    except Exception:
        return False


# ── Legenda ─────────────────────────────────────────────────────────────────


def _find_caption(blocks: list[tuple], rect: fitz.Rect) -> str | None:
    """
    Texto logo abaixo da figura, com sobreposição horizontal — que é como uma
    legenda se posiciona. Prioriza o que começa com "Figura", "Fig.", "Tabela"
    ou "Gráfico"; na ausência, aceita o bloco curto mais próximo.
    """
    best: tuple[float, str] | None = None
    for b in blocks:
        if len(b) < 7 or b[6] != 0:  # 6 = tipo do bloco; 0 = texto
            continue
        x0, y0, x1, y1, text = b[0], b[1], b[2], b[3], (b[4] or "").strip()
        if not text:
            continue
        gap = y0 - rect.y1
        if gap < 0 or gap > CAPTION_GAP_PT:
            continue
        # Precisa estar debaixo da figura, não numa coluna ao lado.
        if x1 < rect.x0 or x0 > rect.x1:
            continue
        flat = " ".join(text.split())
        labelled = flat[:12].lower().startswith(
            ("fig", "figura", "tabela", "gráfico", "grafico", "quadro", "esquema")
        )
        score = gap - (1000 if labelled else 0)
        if len(flat) > CAPTION_MAX_CHARS and not labelled:
            continue
        if best is None or score < best[0]:
            best = (score, flat[:CAPTION_MAX_CHARS])
    return best[1] if best else None


# ── Tabelas ─────────────────────────────────────────────────────────────────


def _tables(page: fitz.Page) -> list[str]:
    """Tabelas em markdown. Silencioso: versões antigas do PyMuPDF não têm."""
    try:
        found = page.find_tables()
    except Exception:
        return []
    out: list[str] = []
    for table in getattr(found, "tables", []) or []:
        try:
            md = table.to_markdown().strip()
        except Exception:
            continue
        if md:
            out.append(md)
    return out


# ── PDF ─────────────────────────────────────────────────────────────────────


def extract_pdf(data: bytes) -> Bundle:
    doc = fitz.open(stream=data, filetype="pdf")
    try:
        pages: list[dict[str, Any]] = []
        images: list[ExtractedImage] = []
        # sha → páginas em que aparece; alimenta o descarte de logo/cabeçalho.
        seen: dict[str, list[int]] = {}
        next_id = 1

        total_chars = 0
        for index, page in enumerate(doc):
            number = index + 1
            text = page.get_text("text").strip()
            total_chars += len(text)
            blocks = page.get_text("blocks")
            page_rect = page.rect
            page_area = max(1.0, page_rect.width * page_rect.height)

            page_images: list[int] = []
            for order, info in enumerate(page.get_images(full=True)):
                xref = info[0]
                try:
                    raw = doc.extract_image(xref)
                except Exception:
                    continue
                normalized = _normalize(raw.get("image", b""))
                if normalized is None:
                    # Alguns formatos embutidos (CMYK, com máscara) não abrem
                    # direto; renderizar via Pixmap resolve.
                    try:
                        pix = fitz.Pixmap(doc, xref)
                        if pix.n - pix.alpha >= 4:  # CMYK → RGB
                            pix = fitz.Pixmap(fitz.csRGB, pix)
                        normalized = _normalize(pix.tobytes("png"))
                    except Exception:
                        normalized = None
                if normalized is None:
                    continue

                blob, width, height = normalized
                digest = hashlib.sha256(blob).hexdigest()
                seen.setdefault(digest, []).append(number)

                rects = page.get_image_rects(xref)
                rect = rects[0] if rects else None
                bbox = [rect.x0, rect.y0, rect.x1, rect.y1] if rect else None
                caption = _find_caption(blocks, rect) if rect else None

                item = ExtractedImage(
                    id=next_id,
                    page=number,
                    order=order,
                    data=blob,
                    width=width,
                    height=height,
                    sha256=digest,
                    bbox=bbox,
                    caption=caption,
                    kind="embedded",
                )
                _apply_filter(item, rect, page_area)
                images.append(item)
                page_images.append(next_id)
                next_id += 1

            pages.append(
                {
                    "page": number,
                    "text": text,
                    "tables": _tables(page),
                    "images": page_images,
                }
            )

        scanned = (total_chars / max(1, len(doc))) < SCANNED_CHARS_PER_PAGE

        # Segunda passada: o que se repete por muitas páginas é template.
        for item in images:
            if item.candidate and len(set(seen.get(item.sha256, []))) >= REPEAT_PAGE_LIMIT:
                item.candidate = False
                item.reject_reason = "repetida em várias páginas (logo/cabeçalho)"

        # Duplicata exata: mantém a primeira ocorrência, descarta as demais.
        kept: set[str] = set()
        for item in images:
            if not item.candidate:
                continue
            if item.sha256 in kept:
                item.candidate = False
                item.reject_reason = "duplicata"
            else:
                kept.add(item.sha256)

        if scanned:
            images.extend(_render_pages(doc, start_id=next_id))

        return Bundle(
            source={
                "type": "pdf",
                "pages": len(doc),
                "scanned": scanned,
                "title": (doc.metadata or {}).get("title") or None,
            },
            pages=pages,
            images=images,
        )
    finally:
        doc.close()


def _apply_filter(item: ExtractedImage, rect: fitz.Rect | None, page_area: float) -> None:
    """Marca a figura como descartada e por quê. Não remove — o motivo é útil."""
    if min(item.width, item.height) < MIN_SIDE_PX:
        item.candidate, item.reject_reason = False, "pequena demais"
        return
    aspect = max(item.width, item.height) / max(1, min(item.width, item.height))
    if aspect > MAX_ASPECT:
        item.candidate, item.reject_reason = False, "faixa/divisória"
        return
    if rect is not None:
        area_ratio = (rect.width * rect.height) / page_area
        if area_ratio < MIN_AREA_RATIO:
            item.candidate, item.reject_reason = False, "ocupa pouco da página"
            return
    if _is_flat(item.data):
        item.candidate, item.reject_reason = False, "cor chapada"


def _render_pages(doc: fitz.Document, start_id: int) -> list[ExtractedImage]:
    """
    PDF digitalizado: não há figura embutida, a página inteira é uma foto.
    Renderiza cada página para que a IA leia o conteúdo e possa apontar um
    pedaço da página como imagem do card.
    """
    out: list[ExtractedImage] = []
    zoom = PAGE_RENDER_DPI / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    for index, page in enumerate(doc):
        try:
            pix = page.get_pixmap(matrix=matrix)
            normalized = _normalize(pix.tobytes("png"))
        except Exception:
            continue
        if normalized is None:
            continue
        blob, width, height = normalized
        out.append(
            ExtractedImage(
                id=start_id + index,
                page=index + 1,
                order=0,
                data=blob,
                width=width,
                height=height,
                sha256=hashlib.sha256(blob).hexdigest(),
                bbox=None,
                caption=None,
                kind="page",
            )
        )
    return out


def extract(data: bytes, mime: str, filename: str) -> Bundle:
    lower = (filename or "").lower()
    if mime == "application/pdf" or lower.endswith(".pdf"):
        return extract_pdf(data)
    raise UnsupportedFormat(mime or lower or "desconhecido")
