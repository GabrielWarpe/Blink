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

# Frescor. NÃO comparar o commit do grafo com o HEAD: commitar o próprio grafo
# move o HEAD, e um commit não conhece o próprio hash antes de existir, então o
# grafo aponta para o commit anterior por construção — a comparação de hashes dá
# "desatualizado" para sempre, mesmo com o grafo perfeito.
#
# A pergunta real é: mudou CÓDIGO desde que o grafo foi construído? Ignoramos
# graphify-out/ em ambos os lados (commits e working tree).
FRESH="Grafo em dia."
BUILT="$(sed -n 's/^- Built from commit: `\(.*\)`$/\1/p' graphify-out/GRAPH_REPORT.md 2>/dev/null | head -1)"

STALE=""
if [ -n "$BUILT" ] && git cat-file -e "$BUILT^{commit}" 2>/dev/null; then
  # Arquivos de código tocados entre o commit do grafo e o HEAD.
  STALE="$(git diff --name-only "$BUILT" HEAD -- . ':!graphify-out' 2>/dev/null | head -5)"
fi
# Mudanças ainda não commitadas também deixam o grafo velho.
DIRTY="$(git status --porcelain -- . ':!graphify-out' 2>/dev/null | head -5)"

if [ -n "$STALE" ] || [ -n "$DIRTY" ]; then
  N=$(printf '%s\n%s' "$STALE" "$DIRTY" | grep -c . )
  FRESH="GRAFO DESATUALIZADO ($N arquivo(s) de código mudaram desde a construção) — rode \`graphify update .\` antes de confiar nele."
fi

# Só o que é DINÂMICO entra aqui. O protocolo de uso (query/explain/path com
# --budget) vive no CLAUDE.md, que já é carregado em toda sessão — repeti-lo
# neste hook seria pagar os mesmos tokens duas vezes.
CONTENT="$(printf 'Mapa do grafo (graphify) — %s\n\n%s\n\nUse estes nomes como ponto de partida do `graphify query`. Protocolo completo no CLAUDE.md.' "$FRESH" "$GODS")"

jq -n --arg c "$CONTENT" \
  '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$c}}' 2>/dev/null

exit 0
