"""
Imagem solta (JPG/PNG/…).

Caso mais simples: a própria imagem é a única figura, e não há texto nenhum.

O ponto que importa: ela **não passa pelo filtro heurístico**. O filtro existe
para separar figura didática de logo dentro de um arquivo cheio de coisas — aqui
o usuário escolheu esta imagem de propósito. Descartá-la por ser pequena ou por
ter fundo chapado seria devolver "não encontrei nada" para quem acabou de
apontar exatamente o que queria.
"""

from __future__ import annotations

from .base import Bundle, ExtractedImage, Options
from .imaging import digest, normalize

MIMES = ("image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff")
EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff")


class ImageExtractor:
    def handles(self, mime: str, filename: str) -> bool:
        return mime in MIMES or filename.lower().endswith(EXTENSIONS)

    def extract(self, data: bytes, filename: str, opts: Options) -> Bundle:
        return extract_image(data, filename)


def extract_image(data: bytes, filename: str = "") -> Bundle:
    normalized = normalize(data)
    if normalized is None:
        raise ValueError("não consegui abrir esta imagem")

    blob, width, height = normalized
    image = ExtractedImage(
        id=1,
        page=1,
        order=0,
        data=blob,
        width=width,
        height=height,
        sha256=digest(blob),
        kind="standalone",
    )

    bundle = Bundle(
        source={"type": "image", "pages": 1, "scanned": False, "title": filename or None},
        pages=[{"page": 1, "text": "", "tables": [], "images": [1]}],
        images=[image],
    )
    # Uma imagem sem texto nenhum é o esperado neste formato, não um problema:
    # nada de aviso "sem_texto" aqui.
    return bundle
