"""
Normalização e pré-limpeza de figuras — compartilhadas por TODOS os formatos.

Esta é a peça que mais economiza. Logotipo, cabeçalho, rodapé e marca d'água têm
assinatura determinística (a mesma imagem repetida em várias páginas ou slides),
então saem de graça aqui, em vez de custar ~1.500 tokens cada para a IA concluir
"isto é um logo".

O filtro é barato e de propósito: passa logo grande e foto de pessoa. Quem
resolve esses é o modelo, mais adiante — aqui só se corta o que dá para cortar
sem pensar.
"""

from __future__ import annotations

import hashlib
import io

from PIL import Image, ImageStat

from .base import MAX_CANDIDATE_IMAGES, Bundle, ExtractedImage

# ── Limiares do filtro ──────────────────────────────────────────────────────

# Lado menor, em pixels: abaixo disso é ícone, marcador ou ruído.
#
# Calibrado com apostila de odontologia real: a 100 px o filtro derrubava séries
# inteiras de figura didática pequena — os estágios de rizogênese a 82×151, os
# diagramas de dentição mista a 129×99. Errar para o lado de manter é barato
# (a IA descarta uma figura ruim depois); errar para o lado de cortar é um card
# que nunca existe, porque a IA nem chega a ver a figura.
MIN_SIDE_PX = 50
# Faixas muito alongadas são divisórias, réguas e bordas decorativas. É esta
# regra — e não o tamanho — que derruba as tarjas pretas de 514×47.
MAX_ASPECT = 8.0
# A mesma imagem em N ou mais páginas é elemento de template, não conteúdo.
REPEAT_PAGE_LIMIT = 3
# Desvio padrão baixo em todos os canais = bloco de cor chapada.
MIN_STDDEV = 8.0

# Lado maior das figuras salvas — mesmo teto do upload manual do app
# (`services/images.ts`), para que a cópia final no `card-images` seja coerente.
MAX_IMAGE_SIDE = 1600
JPEG_QUALITY = 82

# Versão reduzida, usada SÓ no prompt. O custo de visão cresce com a dimensão da
# imagem: 1600px sai por ~1.500 tokens, 900px por menos da metade — e para
# decidir "esta figura ensina isto?" 900px basta. A figura que vira card é
# sempre a grande.
THUMB_SIDE = 900
THUMB_QUALITY = 78


def normalize(raw: bytes) -> tuple[bytes, int, int] | None:
    """Converte para JPEG RGB com teto de lado. None se não for imagem legível."""
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception:
        return None

    # PDF e OOXML guardam muita coisa em CMYK/paleta/com canal alfa; JPEG só
    # aceita RGB.
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


def is_flat(data: bytes) -> bool:
    """Bloco de cor chapada (fundo, tarja, separador) — não ensina nada."""
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
        # Amostra pequena basta e evita percorrer imagem grande inteira.
        img.thumbnail((160, 160))
        stddev = ImageStat.Stat(img).stddev
        return max(stddev) < MIN_STDDEV
    except Exception:
        return False


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def apply_filter(item: ExtractedImage) -> None:
    """
    Pré-limpeza barata. Marca como descartada e por quê — não remove: o motivo
    é útil para depurar "cadê a figura da página 4?".

    Não existe mais regra de área ocupada na página: material real mostrou que
    ela partia do pressuposto errado. Numa apostila densa, a figura mais
    didática costuma ser pequena e estar em grade com outras — a regra derrubava
    exatamente esse caso.
    """
    if min(item.width, item.height) < MIN_SIDE_PX:
        item.reject("pequena demais")
        return
    aspect = max(item.width, item.height) / max(1, min(item.width, item.height))
    if aspect > MAX_ASPECT:
        item.reject("faixa/divisória")
        return
    if is_flat(item.data):
        item.reject("cor chapada")


# Figuras que o extrator produziu de propósito — a página renderizada de um PDF
# digitalizado, a imagem que o próprio usuário anexou. Não são "achadas dentro
# de um arquivo", então nenhuma regra de faxina se aplica a elas: duas páginas
# idênticas de um escaneado continuam sendo duas páginas.
DELIBERATE_KINDS = ("page", "standalone")


def postprocess(bundle: Bundle) -> None:
    """
    Segunda passada, depois que todas as figuras do arquivo são conhecidas:
    template, duplicata e teto de quantidade. Vale para qualquer formato — o
    logo da faculdade repetido em 40 slides de PPTX é o mesmo problema que o
    cabeçalho repetido em 40 páginas de PDF.
    """
    found = [i for i in bundle.images if i.kind not in DELIBERATE_KINDS]

    pages_by_hash: dict[str, set[int]] = {}
    for item in found:
        pages_by_hash.setdefault(item.sha256, set()).add(item.page)

    for item in found:
        if item.candidate and len(pages_by_hash[item.sha256]) >= REPEAT_PAGE_LIMIT:
            item.reject("repetida em várias páginas (logo/cabeçalho)")

    # Duplicata exata: mantém a primeira ocorrência, descarta as demais.
    kept: set[str] = set()
    for item in found:
        if not item.candidate:
            continue
        if item.sha256 in kept:
            item.reject("duplicata")
        else:
            kept.add(item.sha256)

    _cap_candidates(bundle, found)


def _cap_candidates(bundle: Bundle, found: list[ExtractedImage]) -> None:
    """
    Teto de figuras aprovadas. Corta pelo mesmo critério que a geração usa para
    escolher o que mandar ao modelo — legenda primeiro, depois área —, então o
    que se perde é sempre o menos promissor. Página renderizada não entra na
    conta: a quantidade dela já está limitada pelo teto de páginas.
    """
    candidates = [i for i in found if i.candidate]
    if len(candidates) <= MAX_CANDIDATE_IMAGES:
        return

    ranked = sorted(
        candidates, key=lambda i: (i.caption is None, -i.area, i.id)
    )
    for item in ranked[MAX_CANDIDATE_IMAGES:]:
        item.reject("acima do limite de figuras")
    bundle.warn("limite_imagens")
