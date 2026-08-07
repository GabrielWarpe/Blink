## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

O hook SessionStart já injeta os god nodes e o frescor do grafo no começo da
sessão. Use esses nomes como ponto de partida — não reconstrua o contexto lendo
README, package.json ou a árvore de arquivos.

Rules:
- Antes de ler ou grepar arquivos deste repo, consulte o grafo. Escolha o comando
  mais específico que responde à pergunta (custos medidos neste repo):
  - `graphify explain "<símbolo>"` — um nó e seus vizinhos (~350 tokens). O mais
    barato; prefira quando já souber o nome.
  - `graphify query "<pergunta>" --budget 800` — subgrafo escopado. **Sempre passe
    `--budget`**: sem ele o padrão é 2000 tokens e a saída vem com tudo.
  - `graphify path "<A>" "<B>"` — como dois pontos se conectam.
  - `graphify affected "<X>"` — o que quebra se X mudar (use antes de refatorar).
- O grafo devolve `src=arquivo loc=Lnn`. Vá direto nessa linha em vez de ler o
  arquivo inteiro.
- NÃO leia `graphify-out/GRAPH_REPORT.md` (~3.500 tokens) nem `graph.json` (1 MB)
  para perguntas pontuais — só para revisão ampla de arquitetura, e mesmo assim
  depois de query/explain não terem bastado.
- Depois de alterar código, rode `graphify update .` (só AST, sem custo de API).
