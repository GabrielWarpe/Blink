#!/usr/bin/env python3
"""
Compara modelos de IA usando O SEU material, não benchmark genérico.

Roda o mesmo `bundle.json` (produzido pela Fase 1) em vários modelos e em duas
resoluções de miniatura, e mede o que decide a escolha:

  • custo real por apostila e por card — que define a margem de cada assinante;
  • quantos cards saem COM figura (cobertura) e se a figura casa com a pergunta;
  • se a alternativa correta é sistematicamente a mais longa (o quiz que se
    resolve medindo o tamanho da opção, sem saber o conteúdo);
  • quantos cards o validador teve de descartar;
  • tempo de resposta.

Uso:
    export ANTHROPIC_API_KEY=...      # opcional
    export GEMINI_API_KEY=...         # opcional (aistudio.google.com/apikey)
    python scripts/benchmark.py saida/minha-apostila

Modelo sem chave é pulado com aviso — dá para começar só com o Gemini grátis.
Ao final gera `benchmark.html` com os cards lado a lado, porque número não diz
se a pergunta ficou boa: isso é julgamento seu.
"""

from __future__ import annotations

import base64
import html
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Espelham a Edge Function — o benchmark tem de medir o que roda em produção.
MAX_PROMPT_IMAGES = 60
# (o rodízio por rodadas substituiu o teto por página — ver select_images)
MAX_TEXT_CHARS = 400_000
CARDS_TO_GENERATE = 15
THUMB_SIZES = (700, 900)

USD_BRL = 5.40  # só para a leitura em reais; o custo em dólar é o que vale


@dataclass
class Model:
    label: str
    provider: str  # 'anthropic' | 'gemini'
    model_id: str
    usd_in_per_mtok: float
    usd_out_per_mtok: float
    # `effort`/`thinking adaptive` dão 400 nos modelos anteriores ao 4.6 —
    # trocar de modelo NÃO é só trocar a string.
    supports_effort: bool = True


# Preços POR TOKEN em dólar, já no valor PÓS-PROMOÇÃO. As promoções vencem
# (Sonnet 5 em 31/08/2026, Gemini Flash em 31/12/2026) e a decisão precisa valer
# depois disso — comparar preço promocional escolheria o modelo errado.
MODELS = [
    Model("Sonnet 5", "anthropic", "claude-sonnet-5", 3.00, 15.00),
    Model("Haiku 4.5", "anthropic", "claude-haiku-4-5", 1.00, 5.00, supports_effort=False),
    Model("Gemini 3.7 Flash", "gemini", "gemini-3.7-flash", 1.50, 7.50),
]

CARD_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "cards": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "front": {"type": "string"},
                    "back": {"type": "string"},
                    "page": {"type": "integer"},
                    "image_id": {"anyOf": [{"type": "integer"}, {"type": "null"}]},
                    "image_reason": {"anyOf": [{"type": "string"}, {"type": "null"}]},
                    "quiz_options": {"type": "array", "items": {"type": "string"}},
                },
                "required": [
                    "front", "back", "page", "image_id", "image_reason", "quiz_options",
                ],
                "additionalProperties": False,
            },
        }
    },
    "required": ["cards"],
    "additionalProperties": False,
}


# ── Prompt (cópia fiel do que roda na Edge Function) ────────────────────────


def build_system_prompt(count: int, language: str, has_images: bool) -> str:
    base = f"""Você cria material de estudo a partir de um documento que o aluno enviou.

Regras gerais:
- Gere ATÉ {count} cards. Este número é TETO, não meta: se o material só
  sustenta 12 boas questões, devolva 12. QUALIDADE GANHA de quantidade.
- Escreva tudo em {language}.
- Cada card cobre UMA ideia. Nada de pergunta dupla.
- Use a numeração de página do documento no campo "page".
- Ignore capa, sumário, ficha catalográfica, aviso de direitos autorais e recado
  do autor ("me siga nas redes", contatos). Isso não é conteúdo de estudo.

TODO card é flashcard E quiz ao mesmo tempo:
- "front" é a pergunta, "back" é a resposta correta.
- "quiz_options" traz EXATAMENTE 3 alternativas ERRADAS. Nunca repita a correta.
- As erradas precisam ser PLAUSÍVEIS e do mesmo assunto: outras estruturas da
  mesma região, etapas vizinhas do mesmo processo, valores da mesma ordem.
- PARIDADE DE FORMA (regra dura): as quatro opções devem ter comprimento e nível
  de detalhe equivalentes. A correta NÃO pode ser sistematicamente a mais longa
  nem a mais curta; se der para acertar medindo o tamanho da alternativa, o quiz
  não vale nada. Explicação longa vai no enunciado, nunca dentro de uma opção."""

    if not has_images:
        return base + '\n\nEste documento não tem figuras: "image_id" e "image_reason" sempre null.'

    return base + """

Sobre as FIGURAS — leia com atenção, é o que diferencia este material:

Você recebeu as figuras do documento numeradas (IMAGEM #1, #2…). Esse número é
uso INTERNO, só para você preencher "image_id" — o aluno nunca vê numeração
nenhuma. NUNCA escreva "IMAGEM #71", "a Imagem #24" ou "figura 3" dentro de
"front", "back" ou nas alternativas: o card mostra UMA figura, então diga
simplesmente "a figura", "o esquema ao lado", "a radiografia", ou nem cite —
"Que estrutura as setas indicam?" já se entende sozinho.

NÃO escreva o card primeiro para depois procurar uma figura que combine — é
assim que se anexa figura decorativa. Faça o caminho inverso, figura por figura:

1. Olhe a figura e pergunte: o que ela ENSINA?
2. Ela sustenta uma pergunta SOZINHA, sem depender do texto ao redor?
3. Só se sim, escreva a pergunta DERIVADA dela ("Que estrutura está indicada?",
   "Que fase do processo esta figura representa?"), a resposta e as 3 erradas —
   estas últimas tiradas do que a própria figura mostra (outras estruturas
   visíveis nela, estruturas vizinhas).
4. Se a resposta for não, siga para a próxima figura. O resto dos cards sai do
   texto, com "image_id": null.

Regras duras:

- LOGOTIPO NUNCA VIRA CARD. Marca de empresa, tecnologia, produto, instituição,
  rede social, linguagem ou ferramenta não é material de estudo — "que
  tecnologia este logo representa?" testa reconhecimento de marca, não
  conteúdo. Se a figura é essencialmente um logotipo, "image_id": null, sempre.
  O mesmo vale para banner, capa, brasão, foto de pessoa e captura de tela
  decorativa.

- DIAGRAMA É O MELHOR MATERIAL QUE EXISTE. Entidade-relacionamento, caso de uso,
  sequência, classes, fluxograma, arquitetura, esquema anatômico, corte
  histológico, ciclo, linha do tempo, mapa: são figuras que ENSINAM estrutura e
  relação, e é onde a pergunta com imagem vale mais.

- SE A PERGUNTA FALA DE UMA FIGURA, ANEXE AQUELA FIGURA — não é opcional.
  Escrever "no Modelo Entidade-Relacionamento, qual entidade se liga a X?",
  "segundo o fluxograma...", "no esquema de classificação..." e deixar
  "image_id": null é pedir que o aluno adivinhe do que você está falando. Se o
  diagrama está entre as figuras que você recebeu, ele é obrigatório nesse card.
  Se NÃO está, reescreva a pergunta sem citar a figura.

- Faça perguntas EXIGENTES sobre os diagramas: qual relação existe entre dois
  elementos, que etapa vem depois, que classificação aquele padrão representa,
  o que muda entre os casos A, B e C. Interpretar um diagrama denso é estudo de
  alto nível — é aí que este material ganha de um resumo de texto.

- TESTE DO AUTORRESPONDIDO — faça isto ANTES de anexar qualquer figura:
  **leia TODO o texto visível dentro da imagem.** Se a sua resposta, ou uma
  paráfrase próxima dela, aparecer escrita ali em qualquer lugar — título,
  rótulo, legenda interna, caixa, rodapé, trecho de código — o card está
  autorrespondido: "image_id": null. Sem exceção, e independente de a figura
  parecer um diagrama.

  Exemplos reais que passaram indevidamente:
  • figura de CSS Grid com a propriedade "grid-template-columns: repeat(3, 1fr)"
    impressa nela, e
    a pergunta era exatamente essa propriedade;
  • comparação escrita "FLEXBOX: unidimensional / GRID: bidimensional", e a
    pergunta era a diferença entre os dois;
  • quadro com "let — para reatribuição", e a pergunta era quando usar "let".
  Nos três a figura era bonita e do assunto certo — e entregava a resposta.

  INFOGRÁFICO, QUADRO-RESUMO E SLIDE quase nunca servem: são texto diagramado,
  e esse texto já está no documento. O que serve é figura cuja informação é
  VISUAL — forma, posição, relação espacial, padrão — e que você não
  conseguiria descrever só em palavras.

  Reprovam (não anexe — a figura entrega a resposta de graça):
  • tabela cujo valor pedido está numa célula ("qual grupo irrompe entre 12 e
    16 meses?" com a tabela de cronologia ao lado);
  • figura com o nome da estrutura impresso, quando a pergunta é esse nome;
  • seta rotulada que liga exatamente a pergunta à resposta;
  • **captura de tela perguntando o que está escrito nela** — "quais os três
    itens listados no painel?", "qual o nome do usuário exibido?". Isso decora
    dado de exemplo, não conteúdo. Nomes, listas e valores de demonstração que
    aparecem numa interface NUNCA são matéria de estudo. Se a tela ensina algo,
    pergunte sobre o CONCEITO (que fluxo ela representa, que papel de usuário
    acessa aquilo), nunca sobre o texto que está nela.

  PASSAM, e são os melhores cards que existem:
  • figura com seta/destaque numa estrutura SEM o nome escrito;
  • reconhecer forma, padrão, fase ou classificação pela aparência;
  • **interpretar um diagrama denso** — qual entidade se relaciona com qual, que
    etapa vem depois, o que distingue o caso A do B. Aqui a resposta está na
    figura, mas só chega quem entende o que está vendo: isso é estudo, não
    leitura, e o card deve existir COM a figura.

  Na dúvida entre os dois casos: se a pergunta exige entender e não apenas
  localizar, anexe.

  Uma tabela com a resposta dentro dela pode virar card ÓTIMO sem imagem: faça
  a pergunta e deixe "image_id": null. O conteúdo é bom; a figura é que estraga.
- Se a figura mostra vinte estruturas e a pergunta é sobre uma sem indicação
  clara (seta, destaque, círculo), ela NÃO é inequívoca: "image_id": null.
- No máximo 2 cards por figura, e nunca a mesma pergunta duas vezes.
- Escolha pelo SIGNIFICADO, não pela proximidade: a figura da página certa pode
  ser a errada para aquele card.
- Ao usar uma figura, "image_reason" explica em UMA frase por que ela responde
  àquela pergunta ("a seta indica o forame incisivo"). Sem figura, deixe null.
- Na dúvida, "image_id": null — figura errada é pior que card sem figura. Mas
  não seja tímido a ponto de ignorar figura boa: se ela ensina e é inequívoca,
  use."""


# ── Seleção de figuras (mesma regra da Edge Function) ───────────────────────


def select_images(catalog: list[dict]) -> list[dict]:
    """Rodízio por página até encher o orçamento — igual à Edge Function."""
    by_page: dict[int, list[dict]] = {}
    for image in catalog:
        by_page.setdefault(image["page"], []).append(image)
    for group in by_page.values():
        group.sort(key=lambda i: (i.get("caption") is None, -(i["size"][0] * i["size"][1])))

    deepest = max((len(g) for g in by_page.values()), default=0)
    picked: list[dict] = []
    for round_ in range(deepest):
        if len(picked) >= MAX_PROMPT_IMAGES:
            break
        for page in sorted(by_page):
            if round_ < len(by_page[page]):
                picked.append(by_page[page][round_])
            if len(picked) >= MAX_PROMPT_IMAGES:
                break
    return sorted(picked, key=lambda i: i["id"])


def resolve_image(folder: Path, image: dict) -> Path | None:
    """
    Acha o arquivo da figura no disco.

    O `path` do bundle (`img/0007.jpg`) é o nome no bucket; o `try_local.py`
    grava com o número da página junto (`0007_p12.jpg`) para dar para conferir
    a olho. Aceita os dois — senão o benchmark roda sem imagem nenhuma e mede
    a coisa errada sem avisar.
    """
    exact = folder / "img" / Path(image["path"]).name
    if exact.is_file():
        return exact
    matches = sorted((folder / "img").glob(f"{image['id']:04d}_*"))
    return matches[0] if matches else None


def thumbnail(path: Path, side: int) -> bytes:
    img = Image.open(path).convert("RGB")
    img.thumbnail((side, side), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=78, optimize=True)
    return out.getvalue()


# ── Métricas (mesmas regras do validador da Edge Function) ──────────────────


@dataclass
class Run:
    model: str
    thumb: int
    ok: bool = True
    error: str = ""
    seconds: float = 0.0
    in_tokens: int = 0
    out_tokens: int = 0
    cards: list[dict] = field(default_factory=list)
    dropped: int = 0
    usd: float = 0.0

    @property
    def with_image(self) -> int:
        return sum(1 for c in self.cards if c.get("image_id") is not None)

    @property
    def distinct_images(self) -> int:
        return len({c["image_id"] for c in self.cards if c.get("image_id") is not None})

    @property
    def longest_pct(self) -> int:
        if not self.cards:
            return 0
        n = sum(
            1
            for c in self.cards
            if all(len(c["back"]) > len(o) for o in c["quiz_options"])
        )
        return round(n / len(self.cards) * 100)


def validate(cards: list[dict], sent_ids: set[int]) -> tuple[list[dict], int]:
    """Mesmas regras do backend: o benchmark mede o que o usuário receberia."""
    out: list[dict] = []
    per_image: dict[int, int] = {}
    for card in cards:
        front, back = (card.get("front") or "").strip(), (card.get("back") or "").strip()
        if not front or not back:
            continue
        options = [o.strip() for o in (card.get("quiz_options") or []) if o and o.strip()]
        unique = [o for o in dict.fromkeys(options) if o.lower() != back.lower()]
        if len(unique) != 3:
            continue
        image_id = card.get("image_id")
        if image_id is not None:
            if image_id not in sent_ids or not (card.get("image_reason") or "").strip():
                image_id = None
            elif per_image.get(image_id, 0) >= 2:
                image_id = None
            else:
                per_image[image_id] = per_image.get(image_id, 0) + 1
        out.append({**card, "front": front, "back": back,
                    "quiz_options": unique, "image_id": image_id})
    return out, len(cards) - len(out)


# ── Provedores ──────────────────────────────────────────────────────────────


def post(url: str, payload: dict, headers: dict, timeout: int = 300) -> dict:
    request = urllib.request.Request(
        url, data=json.dumps(payload).encode(), headers={**headers, "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read()[:300].decode('utf-8', 'replace')}") from e


def call_anthropic(model: Model, system: str, blocks: list[dict], key: str) -> tuple[dict, int, int]:
    payload: dict[str, Any] = {
        "model": model.model_id,
        "max_tokens": 16000,
        "system": system,
        "messages": [{"role": "user", "content": blocks}],
        "output_config": {"format": {"type": "json_schema", "schema": CARD_SCHEMA}},
    }
    if model.supports_effort:
        # `effort` e `thinking: adaptive` só existem do 4.6 em diante; no Haiku
        # 4.5 a mesma requisição volta 400.
        payload["thinking"] = {"type": "adaptive"}
        payload["output_config"]["effort"] = "medium"

    data = post(
        "https://api.anthropic.com/v1/messages",
        payload,
        {"x-api-key": key, "anthropic-version": "2023-06-01"},
    )
    text = "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")
    usage = data.get("usage", {})
    return json.loads(text), usage.get("input_tokens", 0), usage.get("output_tokens", 0)


def call_gemini(model: Model, system: str, blocks: list[dict], key: str) -> tuple[dict, int, int]:
    parts: list[dict] = []
    for block in blocks:
        if block["type"] == "text":
            parts.append({"text": block["text"]})
        else:
            parts.append({"inline_data": {"mime_type": "image/jpeg", "data": block["source"]["data"]}})

    data = post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model.model_id}:generateContent",
        {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseJsonSchema": CARD_SCHEMA,
                "maxOutputTokens": 16000,
            },
        },
        {"x-goog-api-key": key},
    )
    candidate = data["candidates"][0]
    text = "".join(p.get("text", "") for p in candidate["content"]["parts"])
    usage = data.get("usageMetadata", {})
    return json.loads(text), usage.get("promptTokenCount", 0), usage.get("candidatesTokenCount", 0)


# ── Execução ────────────────────────────────────────────────────────────────


def run_one(model: Model, side: int, bundle: dict, folder: Path, key: str) -> Run:
    run = Run(model=model.label, thumb=side)
    selected = select_images(bundle.get("catalog", []))
    sent_ids = {i["id"] for i in selected}

    text = "\n\n".join(
        f"--- página {p['page']} ---\n{p['text']}"
        + ("\n\n" + "\n\n".join(p["tables"]) if p.get("tables") else "")
        for p in bundle["pages"]
    )[:MAX_TEXT_CHARS]

    blocks: list[dict] = [{"type": "text", "text": f"Conteúdo do documento:\n\n{text}"}]
    for image in selected:
        source = resolve_image(folder, image)
        if source is None:
            continue
        caption = f" — legenda: \"{image['caption']}\"" if image.get("caption") else ""
        blocks.append({"type": "text", "text": f"IMAGEM #{image['id']} — página {image['page']}{caption}"})
        blocks.append({
            "type": "image",
            "source": {"data": base64.b64encode(thumbnail(source, side)).decode()},
        })

    system = build_system_prompt(CARDS_TO_GENERATE, "pt-BR", bool(selected))
    started = time.time()
    try:
        caller = call_anthropic if model.provider == "anthropic" else call_gemini
        parsed, run.in_tokens, run.out_tokens = caller(model, system, blocks, key)
        run.cards, run.dropped = validate(parsed.get("cards", []), sent_ids)
    except Exception as e:  # rede, 4xx, JSON inválido
        run.ok, run.error = False, str(e)[:400]
    run.seconds = time.time() - started
    run.usd = (
        run.in_tokens / 1_000_000 * model.usd_in_per_mtok
        + run.out_tokens / 1_000_000 * model.usd_out_per_mtok
    )
    return run


def report_html(runs: list[Run], folder: Path) -> Path:
    def card_html(c: dict) -> str:
        img = ""
        if c.get("image_id") is not None:
            img = (
                f'<div class=fig>FIGURA #{c["image_id"]}'
                f'<em>{html.escape(c.get("image_reason") or "")}</em></div>'
            )
        opts = "".join(f"<li>{html.escape(o)}</li>" for o in c["quiz_options"])
        return (
            f'<div class=card><b>{html.escape(c["front"])}</b>{img}'
            f'<div class=ok>{html.escape(c["back"])}</div><ul>{opts}</ul></div>'
        )

    cols = "".join(
        f"<td><h2>{html.escape(r.model)} · {r.thumb}px</h2>"
        + (f'<p class=err>{html.escape(r.error)}</p>' if not r.ok else
           f'<p class=meta>{len(r.cards)} cards · {r.with_image} com figura · '
           f'US$ {r.usd:.3f} (R$ {r.usd * USD_BRL:.2f}) · {r.seconds:.0f}s</p>'
           + "".join(card_html(c) for c in r.cards))
        + "</td>"
        for r in runs
    )
    css = """body{font:14px system-ui;background:#111;color:#eee;margin:0;padding:16px}
table{border-collapse:collapse}td{vertical-align:top;padding:8px;min-width:340px;max-width:400px;border-left:1px solid #333}
h2{font-size:15px;margin:0 0 4px}.meta{color:#8b8;font-size:12px;margin:0 0 12px}
.err{color:#f77}.card{background:#1c1c1c;border-radius:10px;padding:10px;margin-bottom:10px}
.ok{color:#7d7;margin:6px 0}ul{margin:0;padding-left:18px;color:#999}
.fig{color:#e2b;font-size:12px;margin-top:6px}.fig em{display:block;color:#777;font-style:normal}"""
    out = folder / "benchmark.html"
    out.write_text(
        f"<meta charset=utf-8><style>{css}</style><table><tr>{cols}</tr></table>",
        encoding="utf-8",
    )
    return out


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    folder = Path(sys.argv[1]).expanduser()
    bundle_path = folder / "bundle.json"
    if not bundle_path.is_file():
        print(f"não achei {bundle_path} — rode antes: scripts/try_local.py <arquivo>", file=sys.stderr)
        return 1
    bundle = json.loads(bundle_path.read_text(encoding="utf-8"))

    keys = {
        "anthropic": os.environ.get("ANTHROPIC_API_KEY", ""),
        "gemini": os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY", ""),
    }
    todo = [m for m in MODELS if keys.get(m.provider)]
    for model in MODELS:
        if not keys.get(model.provider):
            print(f"  · {model.label}: pulado (defina {model.provider.upper()}_API_KEY)")
    if not todo:
        print("\nNenhuma chave definida. Gemini tem camada grátis: aistudio.google.com/apikey")
        return 1

    print(f"\n{bundle['stats']['pages']} páginas · {bundle['stats']['images_kept']} figuras aprovadas")
    print(f"{len(todo)} modelo(s) × {len(THUMB_SIZES)} resoluções\n")

    runs: list[Run] = []
    for model in todo:
        for side in THUMB_SIZES:
            print(f"  → {model.label} @ {side}px ...", end="", flush=True)
            run = run_one(model, side, bundle, folder, keys[model.provider])
            runs.append(run)
            print(f" {run.seconds:.0f}s" if run.ok else f" FALHOU: {run.error[:80]}")

    print(f"\n{'modelo':<18}{'px':>5}{'cards':>7}{'c/fig':>7}{'figs':>6}"
          f"{'+long%':>8}{'desc':>6}{'US$':>8}{'R$':>7}{'seg':>6}")
    print("─" * 78)
    for r in sorted(runs, key=lambda r: r.usd):
        if not r.ok:
            print(f"{r.model:<18}{r.thumb:>5}  FALHOU: {r.error[:44]}")
            continue
        print(f"{r.model:<18}{r.thumb:>5}{len(r.cards):>7}{r.with_image:>7}"
              f"{r.distinct_images:>6}{r.longest_pct:>7}%{r.dropped:>6}"
              f"{r.usd:>8.3f}{r.usd * USD_BRL:>7.2f}{r.seconds:>6.0f}")

    print("\n  c/fig = cards com figura (cobertura) · figs = figuras distintas usadas")
    print("  +long% = correta é a mais longa (ideal ~25%; alto = quiz se resolve pelo tamanho)")
    print("  desc = cards descartados pelo validador")
    print(f"\n  Relatório visual: {report_html(runs, folder)}")
    print("  Os números não dizem se a PERGUNTA ficou boa — abra o HTML e julgue.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
