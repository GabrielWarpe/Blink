# Blink — serviço de extração

Lê o documento que o usuário enviou e devolve o conteúdo já mastigado: texto por
página, figuras recortadas do arquivo, posição de cada uma e legenda quando
existe. **Não fala com a IA** — quem chama é a Edge Function `generate-cards-doc`,
que usa este resultado para montar o prompt.

Existe como serviço separado porque a extração de PDF (PyMuPDF) não tem
equivalente viável no runtime Deno das Edge Functions: 256 MB de RAM, ~200 ms de
CPU e 20 MB de bundle não pagam um decodificador de PDF.

## Formatos

| Entrada | O que sai | Observação |
|---|---|---|
| **PDF** | texto, tabelas, figuras embutidas com posição e legenda | o mais complexo |
| **PPTX** | um slide por página, figuras por slide, notas do apresentador | ordem vem de `sldIdLst`, não do nome do arquivo |
| **DOCX** | texto, tabelas em markdown, figuras | pseudo-página única: o Word não pagina no XML |
| **Imagem** | a própria imagem, sem texto | não passa pelo filtro — foi escolhida de propósito |

Qualquer formato sai no **mesmo** `Bundle`, então quem consome nunca precisa
saber o que entrou. O que não está na lista (`.doc`, `.ppt`, `.odt`, `.epub`…)
volta em **415** com uma mensagem que diz o que fazer, nunca em silêncio.

Para acrescentar um formato: um módulo em `extractors/` que implemente o
protocolo de [`extractors/base.py`](extractors/base.py) e uma entrada na tupla
`EXTRACTORS` de [`extractors/__init__.py`](extractors/__init__.py). Nada mais no
fluxo muda.

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `SUPABASE_URL` | URL do projeto (ex.: `https://abc.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — lê e escreve no bucket privado `imports` |
| `EXTRACTOR_TOKEN` | Segredo compartilhado com a Edge Function. Gere com `openssl rand -hex 32` |
| `IMPORTS_BUCKET` | Opcional, padrão `imports` |
| `MAX_SOURCE_MB` | Opcional, padrão `25` |

### Limites

| Limite | Valor | Por quê |
|---|---|---|
| Tamanho do arquivo | 25 MB | mesmo teto que o app aplica na seleção; acima disso o container de 1 GB sofre com PyMuPDF e Pillow juntos |
| Páginas / slides | 80 | uma aula ou capítulo cabe folgado, e acima disso o texto já estoura o teto do prompt da geração |
| Figuras aprovadas | 60 | a geração só manda 20 ao modelo; 60 dá margem 3× para o ranking escolher |
| Figuras examinadas | 400 | teto de trabalho antes do filtro, contra arquivo patológico |
| ZIP descomprimido | 200 MB | anti zip-bomb: 25 MB expandindo mais de 8× é ataque, não apostila |

Excedentes não falham: processa o que cabe e devolve um aviso.

A service role dá acesso total ao Storage: **este serviço não pode ficar
publicamente acessível sem o `EXTRACTOR_TOKEN`**, e o token não pode ir para o
app — só para os secrets da Edge Function.

## Rodar local

```sh
cd extractor
pip install -r requirements.txt
export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... EXTRACTOR_TOKEN=dev
uvicorn main:app --reload --port 8080
curl localhost:8080/health
```

## Deploy

**Fly.io** (menor custo para uso intermitente; escala a zero):

```sh
fly launch --no-deploy --name blink-extractor
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... EXTRACTOR_TOKEN=...
fly deploy
```

No `fly.toml`, deixe `min_machines_running = 0` e `auto_stop_machines = true` —
a extração é esporádica, não vale manter máquina de pé. O primeiro pedido depois
da ociosidade paga alguns segundos de cold start.

**Cloud Run**:

```sh
gcloud run deploy blink-extractor --source . --region us-central1 \
  --set-env-vars SUPABASE_URL=...,IMPORTS_BUCKET=imports \
  --set-secrets SUPABASE_SERVICE_ROLE_KEY=...:latest,EXTRACTOR_TOKEN=...:latest \
  --memory 1Gi --no-allow-unauthenticated
```

1 GiB é o mínimo confortável: PDF grande com muitas figuras consome memória
enquanto o PyMuPDF e o Pillow trabalham.

**Render / Railway**: apontar para este diretório, runtime Docker, e cadastrar
as mesmas variáveis.

## Contrato

```http
POST /extract
x-extractor-token: <segredo>

{ "user_id": "uuid", "job_id": "uuid",
  "source_path": "uuid/uuid/source.pptx",
  "mime": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "filename": "aula03.pptx",
  // Só ligar quando houver IA adiante para LER as páginas (ver "PDF digitalizado").
  "render_scanned_pages": false }
```

```json
{ "bundle_path": "uuid/uuid/bundle.json",
  "stats": { "pages": 42, "images_found": 63, "images_kept": 11,
             "scanned": false, "chars": 48210 },
  "warnings": [{ "code": "figuras_vetoriais", "message": "Na páginas 3, 4..." }] }
```

Erros carregam a mensagem pronta para o usuário em `detail`: **415** formato não
suportado, **413** arquivo grande demais, **422** ilegível (corrompido, com
senha), **401** token inválido, **400** caminho fora da pasta do usuário.

O `bundle.json` gravado no bucket:

```jsonc
{
  "source": { "type": "pdf", "pages": 42, "scanned": false, "title": null },
  "pages": [
    { "page": 8, "text": "O coração humano possui quatro cavidades...",
      "tables": ["| Câmara | Função |\n|---|---|\n..."],
      "images": [3] }
  ],
  // Só o que passou no filtro — é esta lista que vira o prompt.
  "catalog": [
    { "id": 3, "page": 8, "order": 2, "path": "img/0003.jpg",
      "bbox": [250, 420, 690, 780], "size": [880, 720],
      "caption": "Figura 2 — Cavidades cardíacas", "kind": "embedded",
      "candidate": true, "reject_reason": null }
  ],
  // Guardado para diagnóstico: por que cada figura ficou de fora.
  "rejected": [
    { "id": 1, "reject_reason": "repetida em várias páginas (logo/cabeçalho)", "…": "…" }
  ],
  "stats": { "…": "…" }
}
```

## O filtro

Roda antes da IA e é onde mora a economia — cada figura enviada ao modelo custa
~1.500 tokens, então descartar um logotipo por regra determinística é de graça,
e perguntar para a IA se aquilo é um logotipo, não.

| Descarte | Regra |
|---|---|
| Ícone, marcador, ruído | lado menor < 50 px |
| Divisória, régua, borda | proporção > 8:1 |
| Fundo, tarja | desvio padrão de cor quase nulo |
| **Logo, cabeçalho, rodapé, marca d'água** | mesma imagem em 3+ páginas |
| Repetição | hash idêntico a uma figura já aceita |

Os limiares são constantes no topo de [`extractors/imaging.py`](extractors/imaging.py),
e valem para **todos** os formatos: o logo da faculdade repetido em 40 slides de
PPTX é o mesmo problema que o cabeçalho repetido em 40 páginas de PDF. Se
material real mostrar que estão apertados ou frouxos demais, é lá que se mexe —
o campo `rejected` do bundle diz exatamente o que cada regra derrubou.

O filtro é barato de propósito e deixa passar logotipo grande e foto de pessoa.
Quem resolve esses é o modelo, mais adiante: aqui só se corta o que dá para
cortar sem pensar.

**Os limiares erram para o lado de manter, e isso é deliberado.** Deixar passar
uma figura ruim custa alguns tokens uma vez; cortar uma boa custa um card que
nunca existe, porque o modelo nem chega a ver a figura. Numa apostila de
odontologia real, o filtro antigo (lado mínimo 100 px + área mínima de 1,2% da
página) aprovava 43 de 156 figuras — e junto com os logos levava embora séries
inteiras de material de prova: os estágios de rizogênese a 82×151, os diagramas
de dentição mista a 129×99, as faces oclusais anotadas a 115×115. A regra de
área foi removida e o lado mínimo caiu para 50 px: a mesma apostila passou a
aprovar 111, e o que ficou de fora são as tarjas pretas e os logos de rede
social — que caem pela proporção e pela repetição entre páginas, não pelo
tamanho.

Página renderizada e imagem solta **não** passam pelo filtro — não foram achadas
dentro de um arquivo, foram produzidas de propósito.

## Avisos

A extração pode dar certo e ainda assim ter uma ressalva. Elas voltam em
`warnings`, e a regra é nunca falhar em silêncio:

| Código | Quando |
|---|---|
| `pdf_escaneado` | PDF é fotografia de página, sem camada de texto |
| `figuras_vetoriais` | a página tem desenho vetorial, que não existe como bitmap no arquivo |
| `sem_imagens` | nenhuma figura sobreviveu ao filtro |
| `sem_texto` | nenhum texto no arquivo |
| `limite_paginas` / `limite_imagens` | passou de um teto; processou o que cabia |

## PDF digitalizado

Quando o PDF é só fotografia das páginas (apostila escaneada, capítulo passado
no scanner), não há texto nem figura de conteúdo para extrair: cada "imagem
embutida" é a página inteira. O serviço detecta pela média de caracteres por
página, marca `scanned: true` e devolve o aviso `pdf_escaneado` — sem entregar as
fotos de página como se fossem ilustrações, que seria contradizer o próprio
aviso.

Com `render_scanned_pages: true` ele ainda renderiza cada página a 150 dpi, para
que um modelo com visão leia a página e possa apontar um pedaço dela como imagem
do card. Só faz sentido quando há IA adiante no fluxo; por isso vem desligado.

## Conferir a extração sem subir nada

A forma mais rápida de ver se o material rende figura aproveitável:

```sh
python scripts/try_local.py ~/material/anatomia.pdf
```

Roda o roteador num arquivo local e despeja `bundle.json`, as figuras aprovadas
em `img/` e as descartadas em `rejeitadas/` — estas com o motivo no nome, que é
o que permite calibrar os limiares olhando material de verdade.
