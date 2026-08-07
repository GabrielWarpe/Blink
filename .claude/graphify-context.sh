#!/usr/bin/env bash
# Injeta um resumo MÍNIMO do grafo no início da sessão (hook SessionStart).
#
# Objetivo: gastar ~200 tokens uma vez por sessão para evitar que o assistente
# gaste milhares relendo README, package.json e a árvore de arquivos só para se
# orientar. Por isso aqui vai só o mapa (god nodes) + frescor + protocolo —
# nunca o GRAPH_REPORT.md inteiro, que sozinho custa ~3.500 tokens.
#
# Silencioso e exit 0 em qualquer falha: um hook de contexto nunca deve
# atrapalhar a abertura da sessão.

set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT" 2>/dev/null || exit 0

# Sem grafo não há nada a injetar.
[ -f graphify-out/graph.json ] || exit 0

# O PATH de um hook não é o do shell interativo (~/.local/bin costuma faltar),
# então procuramos o binário nos lugares usuais antes de desistir.
GRAPHIFY="$(command -v graphify 2>/dev/null)"
for c in "$HOME/.local/bin/graphify" /opt/homebrew/bin/graphify /usr/local/bin/graphify; do
  [ -n "$GRAPHIFY" ] && break
  [ -x "$c" ] && GRAPHIFY="$c"
done
[ -n "$GRAPHIFY" ] || exit 0

GODS="$("$GRAPHIFY" god-nodes --top 12 2>/dev/null)" || exit 0
[ -n "$GODS" ] || exit 0

# Frescor: o relatório grava o commit de origem; se divergir do HEAD, o grafo
# está velho e o assistente precisa saber ANTES de confiar nele.
FRESH=""
BUILT="$(sed -n 's/^- Built from commit: `\(.*\)`$/\1/p' graphify-out/GRAPH_REPORT.md 2>/dev/null | head -1)"
HEAD_SHA="$(git rev-parse --short=8 HEAD 2>/dev/null)"
if [ -n "$BUILT" ] && [ -n "$HEAD_SHA" ] && [ "$BUILT" != "$HEAD_SHA" ]; then
  FRESH="GRAFO DESATUALIZADO (construído em $BUILT, HEAD é $HEAD_SHA) — rode \`graphify update .\` antes de confiar nele."
else
  FRESH="Grafo em dia com o HEAD."
fi

# Só o que é DINÂMICO entra aqui. O protocolo de uso (query/explain/path com
# --budget) vive no CLAUDE.md, que já é carregado em toda sessão — repeti-lo
# neste hook seria pagar os mesmos tokens duas vezes.
CONTENT="$(printf 'Mapa do grafo (graphify) — %s\n\n%s\n\nUse estes nomes como ponto de partida do `graphify query`. Protocolo completo no CLAUDE.md.' "$FRESH" "$GODS")"

jq -n --arg c "$CONTENT" \
  '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$c}}' 2>/dev/null

exit 0
