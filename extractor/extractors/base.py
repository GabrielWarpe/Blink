"""
Contrato comum a todos os formatos.

A regra que sustenta o roteador: seja PDF, PPTX, DOCX ou uma foto solta, a saída
é sempre um `Bundle` com a mesma forma. Quem consome (a Edge Function, e depois
a IA) nunca precisa saber de que tipo de arquivo o material veio.

Acrescentar um formato = um módulo novo que devolve `Bundle` + uma entrada na
tupla de `__init__.py`. Nada mais no fluxo muda.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

# ── Limites ─────────────────────────────────────────────────────────────────
#
# Protegem tempo de execução aqui e custo de IA na Fase 2. Ver README.

# Páginas de PDF ou slides de PPTX processados. Uma aula ou capítulo cabe
# folgado; acima disso o texto já estoura o teto do prompt da geração.
MAX_PAGES = 80
# Figuras que sobrevivem ao filtro e sobem para o bucket. A geração só manda 20
# ao modelo, mas o teto não pode ser apertado a ponto de escolher pelo lugar do
# ranking em vez de pelo conteúdo: uma apostila de 49 páginas rendeu 111 figuras
# legítimas, e o custo disso no bucket foi 1,1 MB. Storage aqui é barato; figura
# perdida, não.
MAX_CANDIDATE_IMAGES = 150
# Teto de figuras EXAMINADAS (antes do filtro). Protege de arquivo patológico
# com milhares de fragmentos de imagem.
MAX_RAW_IMAGES = 400


class UnsupportedFormat(Exception):
    """Formato que nenhum extrator registrado sabe ler."""


# ── Avisos ──────────────────────────────────────────────────────────────────
#
# Canal separado do erro: a extração DEU certo, mas com uma ressalva que o
# usuário precisa ver. Nunca falhar em silêncio é requisito, não capricho —
# um PDF escaneado que devolve zero figuras sem explicação parece um bug.

WARNING_MESSAGES = {
    "pdf_escaneado": (
        "Este PDF é digitalizado: as páginas são fotos, não texto. Ainda não "
        "consigo separar as figuras dele."
    ),
    "figuras_vetoriais": (
        "As figuras deste arquivo parecem ser desenhos vetoriais, que não ficam "
        "guardados como imagem. Elas não foram extraídas."
    ),
    "sem_imagens": "Não encontrei nenhuma figura aproveitável neste arquivo.",
    "sem_texto": "Não encontrei texto neste arquivo.",
    "limite_paginas": f"Arquivo longo: processei só as primeiras {MAX_PAGES} páginas.",
    "limite_imagens": f"Muitas figuras: mantive as {MAX_CANDIDATE_IMAGES} mais promissoras.",
}


@dataclass
class Options:
    """Ajustes do extrator para uma chamada."""

    # Renderizar cada página como imagem quando o PDF é digitalizado. Serve para
    # a IA LER a página — sem IA no fluxo (Fase 1) é trabalho e storage jogados
    # fora, então vem desligado. A Fase 2 liga.
    render_scanned_pages: bool = False
    # Detectar tabelas e convertê-las em markdown. É a parte mais cara da
    # extração de PDF (~10 s numa apostila de 49 páginas) e só serve ao prompt
    # da geração — o preview nem as mostra. O job de extração-apenas desliga;
    # o de geração liga, onde +10 s somem atrás do tempo de IA.
    extract_tables: bool = True


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
    bbox: list[float] | None = None
    caption: str | None = None
    kind: str = "embedded"  # 'embedded' | 'page' | 'standalone'
    candidate: bool = True
    reject_reason: str | None = None

    @property
    def path(self) -> str:
        return f"img/{self.id:04d}.jpg"

    @property
    def thumb_path(self) -> str:
        return f"thumb/{self.id:04d}.jpg"

    @property
    def area(self) -> int:
        return self.width * self.height

    def reject(self, reason: str) -> None:
        self.candidate = False
        self.reject_reason = reason

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
    pages: list[dict[str, Any]] = field(default_factory=list)
    images: list[ExtractedImage] = field(default_factory=list)
    warnings: list[dict[str, str]] = field(default_factory=list)
    extra_stats: dict[str, Any] = field(default_factory=dict)

    def warn(self, code: str, message: str | None = None) -> None:
        """Registra um aviso uma única vez."""
        if any(w["code"] == code for w in self.warnings):
            return
        self.warnings.append(
            {"code": code, "message": message or WARNING_MESSAGES.get(code, code)}
        )

    @property
    def candidates(self) -> list[ExtractedImage]:
        return [i for i in self.images if i.candidate]

    def to_json(self) -> dict[str, Any]:
        candidates = self.candidates
        return {
            "source": self.source,
            "pages": self.pages,
            # Catálogo achatado só com o que passou no filtro: é exatamente a
            # lista que vira o prompt, na ordem em que aparece no documento.
            "catalog": [i.to_json() for i in candidates],
            "rejected": [i.to_json() for i in self.images if not i.candidate],
            "warnings": self.warnings,
            "stats": {
                "pages": len(self.pages),
                "images_found": len(self.images),
                "images_kept": len(candidates),
                "scanned": self.source.get("scanned", False),
                "chars": sum(len(p.get("text", "")) for p in self.pages),
                **self.extra_stats,
            },
        }


class Extractor(Protocol):
    """
    Um formato de arquivo. Toda implementação devolve o MESMO `Bundle`, e é a
    única coisa que o roteador conhece.
    """

    def handles(self, mime: str, filename: str) -> bool:
        """Este extrator sabe ler o arquivo?"""
        ...

    def extract(self, data: bytes, filename: str, opts: Options) -> Bundle: ...
