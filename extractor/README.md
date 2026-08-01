# Blink — serviço de extração

Lê o documento que o usuário enviou e devolve o conteúdo já mastigado: texto por
página, figuras recortadas do arquivo, posição de cada uma e legenda quando
existe. **Não fala com a IA** — quem chama é a Edge Function `generate-cards`,
que usa este resultado para montar o prompt.

Existe como serviço separado porque a extração de PDF (PyMuPDF) não tem
equivalente maduro no runtime Deno das Edge Functions.

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `SUPABASE_URL` | URL do projeto (ex.: `https://abc.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — lê e escreve no bucket privado `imports` |
| `EXTRACTOR_TOKEN` | Segredo compartilhado com a Edge Function. Gere com `openssl rand -hex 32` |
| `IMPORTS_BUCKET` | Opcional, padrão `imports` |
| `MAX_SOURCE_MB` | Opcional, padrão `40` |

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
  "source_path": "uuid/uuid/source.pdf",
  "mime": "application/pdf", "filename": "anatomia.pdf" }
```

```json
{ "bundle_path": "uuid/uuid/bundle.json",
  "stats": { "pages": 42, "images_found": 63, "images_kept": 11,
             "scanned": false, "chars": 48210 } }
```

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
| Ícone, marcador, ruído | lado menor < 100 px |
| Divisória, régua, borda | proporção > 8:1 |
| Elemento miúdo | ocupa < 1,2% da área da página |
| Fundo, tarja | desvio padrão de cor quase nulo |
| **Logo, cabeçalho, rodapé, marca d'água** | mesma imagem em 3+ páginas |
| Repetição | hash idêntico a uma figura já aceita |

Os limiares são constantes no topo do [`extract.py`](extract.py). Se material
real mostrar que estão apertados ou frouxos demais, é lá que se mexe — o campo
`rejected` do bundle diz exatamente o que cada regra derrubou.

## PDF digitalizado

Quando o PDF é só fotografia das páginas (apostila escaneada, capítulo passado
no scanner), não há texto nem figura embutida para extrair. O serviço detecta
pela média de caracteres por página, marca `scanned: true` e renderiza cada
página a 150 dpi como imagem — o Sonnet lê a página e ainda pode apontar um
pedaço dela como imagem do card.
