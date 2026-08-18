"""
PDF — o formato mais rico e o mais difícil.

Texto por página, figuras embutidas com posição e legenda, e tabelas em
markdown. Os dois casos que a extração de imagem embutida NÃO cobre (PDF
digitalizado e figura vetorial) são detectados aqui e viram aviso, nunca
silêncio.
"""

from __future__ import annotations

from typing import Any

import fitz  # PyMuPDF

from .base import MAX_PAGES, MAX_RAW_IMAGES, Bundle, ExtractedImage, Options
from .imaging import apply_filter, digest, normalize, postprocess

# Menos caracteres que isto por página, em média, e o PDF é digitalização: as
# letras estão dentro de uma foto, não no arquivo.
SCANNED_CHARS_PER_PAGE = 60
# Resolução do render de página (só para PDF digitalizado). 150 dpi lê bem sem
# gerar arquivo gigante.
PAGE_RENDER_DPI = 150
# Distância máxima, em pontos, entre a base da figura e a legenda abaixo dela.
CAPTION_GAP_PT = 64
CAPTION_MAX_CHARS = 180

# Traçados vetoriais numa página SEM figura embutida aprovada. Acima disso o
# conteúdo visual é desenho (diagrama feito no editor), que não sai por extração
# de imagem — o arquivo não guarda bitmap nenhum para essa figura.
VECTOR_PATHS_PER_PAGE = 40


class PdfExtractor:
    def handles(self, mime: str, filename: str) -> bool:
        return mime == "application/pdf" or filename.lower().endswith(".pdf")

    def extract(self, data: bytes, filename: str, opts: Options) -> Bundle:
        return extract_pdf(data, opts)


def extract_pdf(data: bytes, opts: Options | None = None) -> Bundle:
    opts = opts or Options()
    doc = fitz.open(stream=data, filetype="pdf")
    try:
        total_pages = doc.page_count
        limit = min(total_pages, MAX_PAGES)

        pages: list[dict[str, Any]] = []
        images: list[ExtractedImage] = []
        next_id = 1
        total_chars = 0
        # Páginas com desenho vetorial e nenhuma figura embutida aproveitável.
        vector_pages: list[int] = []

        for index in range(limit):
            page = doc[index]
            number = index + 1
            text = page.get_text("text").strip()
            total_chars += len(text)
            blocks = page.get_text("blocks")

            page_images: list[int] = []
            kept_here = 0
            for order, info in enumerate(page.get_images(full=True)):
                if len(images) >= MAX_RAW_IMAGES:
                    break
                item = _read_embedded(doc, page, blocks, info, next_id, number, order)
                if item is None:
                    continue

                apply_filter(item)
                if item.candidate:
                    kept_here += 1

                images.append(item)
                page_images.append(next_id)
                next_id += 1

            if kept_here == 0 and _looks_vectorial(page):
                vector_pages.append(number)

            pages.append(
                {
                    "page": number,
                    "text": text,
                    "tables": _tables(page) if opts.extract_tables else [],
                    "images": page_images,
                }
            )

        scanned = (total_chars / max(1, limit)) < SCANNED_CHARS_PER_PAGE

        bundle = Bundle(
            source={
                "type": "pdf",
                "pages": total_pages,
                "scanned": scanned,
                "title": (doc.metadata or {}).get("title") or None,
            },
            pages=pages,
            images=images,
        )

        # PDF digitalizado: cada "figura" embutida é a página inteira
        # fotografada, não uma figura do conteúdo. Devolvê-las contradiria o
        # aviso — o usuário receberia 40 fotos de página como se fossem
        # ilustrações. Separar figura de dentro de um escaneado exige recortar a
        # página, que é trabalho de outra fase.
        if scanned:
            bundle.warn("pdf_escaneado")
            for item in bundle.images:
                if item.candidate:
                    item.reject("página digitalizada, não é figura")
            # Sem IA no fluxo, renderizar tudo é trabalho e storage jogados
            # fora — a Fase 2 liga isto para o modelo poder LER as páginas.
            if opts.render_scanned_pages:
                bundle.images.extend(_render_pages(doc, limit, start_id=next_id))

        postprocess(bundle)

        if total_pages > limit:
            bundle.warn("limite_paginas")
        if vector_pages:
            bundle.extra_stats["vector_pages"] = vector_pages
            bundle.warn("figuras_vetoriais", _vector_message(vector_pages))
        if not bundle.candidates and not scanned:
            bundle.warn("sem_imagens")
        if total_chars == 0 and not scanned:
            bundle.warn("sem_texto")

        return bundle
    finally:
        doc.close()


def _vector_message(pages: list[int]) -> str:
    """Mensagem precisa: dizer QUAIS páginas, porque "algumas figuras" não ajuda."""
    shown = ", ".join(str(p) for p in pages[:6])
    resto = f" (e mais {len(pages) - 6})" if len(pages) > 6 else ""
    plural = "páginas" if len(pages) > 1 else "página"
    return (
        f"Na {plural} {shown}{resto} as figuras parecem ser desenhos vetoriais. "
        "Esse tipo de figura não fica guardado como imagem no arquivo, então não "
        "foi extraído."
    )


def _first_rect(page: fitz.Page, xref: int) -> fitz.Rect | None:
    try:
        rects = page.get_image_rects(xref)
    except Exception:
        return None
    return rects[0] if rects else None


def _read_embedded(
    doc: fitz.Document,
    page: fitz.Page,
    blocks: list[tuple],
    info: tuple,
    image_id: int,
    number: int,
    order: int,
) -> ExtractedImage | None:
    """Uma figura embutida, já normalizada, com posição e legenda."""
    xref = info[0]
    try:
        raw = doc.extract_image(xref).get("image", b"")
    except Exception:
        raw = b""

    normalized = normalize(raw) if raw else None
    if normalized is None:
        # Alguns formatos embutidos (CMYK, com máscara) não abrem direto;
        # renderizar via Pixmap resolve.
        try:
            pix = fitz.Pixmap(doc, xref)
            if pix.n - pix.alpha >= 4:  # CMYK → RGB
                pix = fitz.Pixmap(fitz.csRGB, pix)
            normalized = normalize(pix.tobytes("png"))
        except Exception:
            normalized = None
    if normalized is None:
        return None

    blob, width, height = normalized
    rect = _first_rect(page, xref)
    return ExtractedImage(
        id=image_id,
        page=number,
        order=order,
        data=blob,
        width=width,
        height=height,
        sha256=digest(blob),
        bbox=[rect.x0, rect.y0, rect.x1, rect.y1] if rect is not None else None,
        caption=_find_caption(blocks, rect) if rect is not None else None,
    )


def _looks_vectorial(page: fitz.Page) -> bool:
    """
    Diagrama desenhado no editor (setas, caixas, linhas) em vez de figura
    colada. Não existe bitmap para extrair — só detectar e avisar. Rasterizar a
    região é trabalho de fase futura.
    """
    try:
        drawings = page.get_drawings()
    except Exception:
        return False
    return len(drawings) >= VECTOR_PATHS_PER_PAGE


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


# Teto de tabelas aproveitadas por página. O detector marca grade visual como
# "tabela" (diagrama em grid, calendário de figuras), e uma página real não tem
# dezenas de tabelas de conteúdo.
MAX_TABLES_PER_PAGE = 3


def _tables(page: fitz.Page) -> list[str]:
    """
    Tabelas em markdown. Silencioso: versões antigas do PyMuPDF não têm.

    O texto das células é montado aqui distribuindo as palavras da página pelas
    caixas das células — o `to_markdown()` do PyMuPDF re-analisa a página
    INTEIRA para cada célula, e numa apostila real isso custava 42 s dos 59 s da
    extração (2.400+ células). Uma leitura de palavras por página dá o mesmo
    resultado em milissegundos.
    """
    try:
        found = page.find_tables()
    except Exception:
        return []
    tables = getattr(found, "tables", []) or []
    if not tables:
        return []

    words = page.get_text("words")  # uma passada; (x0, y0, x1, y1, texto, ...)
    out: list[str] = []
    for table in tables:
        md = _table_markdown(table, words)
        if md:
            out.append(md)
        if len(out) >= MAX_TABLES_PER_PAGE:
            break
    return out


def _table_markdown(table, words: list[tuple]) -> str | None:
    """Markdown de uma tabela, ou None se ela parece grade decorativa."""
    rows = getattr(table, "rows", None) or []
    if len(rows) < 2:
        return None

    grid: list[list[str]] = []
    filled = 0
    for row in rows:
        cells: list[str] = []
        for bbox in row.cells:
            if bbox is None:
                cells.append("")
                continue
            x0, y0, x1, y1 = bbox
            text = " ".join(
                w[4]
                for w in words
                if x0 <= (w[0] + w[2]) / 2 <= x1 and y0 <= (w[1] + w[3]) / 2 <= y1
            ).strip()
            cells.append(text)
            if text:
                filled += 1
        grid.append(cells)

    width = max(len(r) for r in grid)
    total = len(grid) * width
    # Grade com quase tudo vazio, ou de coluna única, é layout — não conteúdo.
    if width < 2 or total == 0 or filled / total < 0.25:
        return None

    grid = [r + [""] * (width - len(r)) for r in grid]
    head, *rest = grid
    lines = ["| " + " | ".join(head) + " |", "|" + "---|" * width]
    lines += ["| " + " | ".join(r) + " |" for r in rest]
    return "\n".join(lines)


def _render_pages(
    doc: fitz.Document, limit: int, start_id: int
) -> list[ExtractedImage]:
    """
    PDF digitalizado: não há figura embutida, a página inteira é uma foto.
    Renderiza cada página para que a IA leia o conteúdo e possa apontar um
    pedaço da página como imagem do card.
    """
    out: list[ExtractedImage] = []
    zoom = PAGE_RENDER_DPI / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    for index in range(limit):
        try:
            pix = doc[index].get_pixmap(matrix=matrix)
            normalized = normalize(pix.tobytes("png"))
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
                sha256=digest(blob),
                kind="page",
            )
        )
    return out
