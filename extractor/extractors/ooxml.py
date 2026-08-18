"""
Base comum de DOCX e PPTX.

Os dois são ZIP com XML dentro — bem mais simples que PDF: as figuras já estão
prontas em `word/media/` ou `ppt/media/`, é só pegar. O trabalho real aqui é ler
o ZIP de um arquivo que o usuário mandou sem confiar nele.

Só stdlib (`zipfile`, `xml.etree`): nenhuma dependência nova.
"""

from __future__ import annotations

import posixpath
import re
import zipfile
from xml.etree import ElementTree

from .base import UnsupportedFormat

# Anti zip-bomb: 25 MB de entrada que expandem além de 8× é ataque, não
# apostila. O `zipfile` só descomprime sob demanda, então a checagem é feita
# na tabela de diretórios, antes de ler qualquer byte.
MAX_ZIP_UNCOMPRESSED = 200 * 1024 * 1024
# `xml.etree` não é imune a *billion laughs*; um teto de tamanho é a defesa
# barata. Nenhum `document.xml` legítimo chega perto disso.
MAX_XML_BYTES = 40 * 1024 * 1024
# Teto por figura, para não estourar memória com um TIFF gigante embutido.
MAX_MEDIA_BYTES = 40 * 1024 * 1024

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
}

R_EMBED = f"{{{NS['r']}}}embed"
R_ID = f"{{{NS['r']}}}id"

# Extensões que o Pillow abre. SVG e EMF/WMF são vetoriais — ficam de fora de
# propósito (não há bitmap para aproveitar).
MEDIA_EXTENSIONS = (".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tif", ".tiff", ".webp")


def open_zip(data: bytes) -> zipfile.ZipFile:
    """Abre o pacote OOXML recusando o que não é ZIP ou expande demais."""
    try:
        zf = zipfile.ZipFile(_BytesReader(data))
    except zipfile.BadZipFile as e:
        raise UnsupportedFormat("arquivo não é um pacote Office válido") from e

    total = sum(info.file_size for info in zf.infolist())
    if total > MAX_ZIP_UNCOMPRESSED:
        zf.close()
        raise ValueError("conteúdo descomprimido acima do limite")
    return zf


def read_bytes(zf: zipfile.ZipFile, name: str, limit: int) -> bytes | None:
    """Lê um membro do ZIP respeitando um teto. None se não existe ou estoura."""
    try:
        info = zf.getinfo(name)
    except KeyError:
        return None
    if info.file_size > limit:
        return None
    try:
        return zf.read(name)
    except Exception:
        return None


def parse_xml(zf: zipfile.ZipFile, name: str) -> ElementTree.Element | None:
    raw = read_bytes(zf, name, MAX_XML_BYTES)
    if raw is None:
        return None
    try:
        return ElementTree.fromstring(raw)
    except ElementTree.ParseError:
        return None


def relationships(zf: zipfile.ZipFile, part: str) -> dict[str, str]:
    """
    Mapa `rId` → caminho do alvo dentro do ZIP, para o `.rels` de uma parte.
    É o que amarra a figura ao slide/parágrafo certo: o XML só cita o rId.
    """
    folder, filename = posixpath.split(part)
    root = parse_xml(zf, posixpath.join(folder, "_rels", f"{filename}.rels"))
    if root is None:
        return {}

    out: dict[str, str] = {}
    for node in root.findall("rel:Relationship", NS):
        rid, target = node.get("Id"), node.get("Target")
        if not rid or not target or node.get("TargetMode") == "External":
            continue
        # Alvos vêm relativos à parte ("../media/image1.png").
        out[rid] = posixpath.normpath(posixpath.join(folder, target)).lstrip("/")
    return out


def is_media(name: str) -> bool:
    return name.lower().endswith(MEDIA_EXTENSIONS)


def media_members(zf: zipfile.ZipFile, prefix: str) -> list[str]:
    """Figuras da pasta de mídia, em ordem natural (image2 antes de image10)."""
    names = [
        n for n in zf.namelist() if n.startswith(prefix) and is_media(n)
    ]
    return sorted(names, key=natural_key)


def read_media(zf: zipfile.ZipFile, name: str) -> bytes | None:
    return read_bytes(zf, name, MAX_MEDIA_BYTES)


def text_of(node: ElementTree.Element, tag: str) -> str:
    """Junta o texto de todos os nós `tag` descendentes, na ordem do documento."""
    return "".join(t.text or "" for t in node.iter(tag))


def natural_key(name: str) -> tuple:
    """Ordena image2 antes de image10, ao contrário da ordem alfabética."""
    return tuple(
        int(part) if part.isdigit() else part
        for part in re.split(r"(\d+)", name)
    )


class _BytesReader:
    """
    `zipfile` quer um objeto com seek/read. `io.BytesIO(data)` serve, mas
    duplica o buffer; esta casca lê direto dos bytes que já estão na memória.
    """

    def __init__(self, data: bytes) -> None:
        self._data = data
        self._pos = 0

    def read(self, size: int = -1) -> bytes:
        if size < 0:
            chunk = self._data[self._pos :]
        else:
            chunk = self._data[self._pos : self._pos + size]
        self._pos += len(chunk)
        return chunk

    def seek(self, offset: int, whence: int = 0) -> int:
        base = {0: 0, 1: self._pos, 2: len(self._data)}[whence]
        self._pos = max(0, base + offset)
        return self._pos

    def tell(self) -> int:
        return self._pos

    def seekable(self) -> bool:
        return True
