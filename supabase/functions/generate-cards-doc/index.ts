// Supabase Edge Function: geração de cards A PARTIR DE DOCUMENTO, com imagens.
//
// Diferente da `generate-cards` (que segue viva para texto/foto/.docx e responde
// na hora), aqui o trabalho é longo demais para uma requisição: extrair o PDF,
// mandar as figuras para o modelo julgar e copiar as escolhidas leva dezenas de
// segundos. Então o app cria uma linha em `import_jobs`, esta função responde
// 202 na hora e segue trabalhando em segundo plano (`EdgeRuntime.waitUntil`),
// atualizando o `status` — que é o que o app fica lendo para mostrar progresso.
//
// A extração em si NÃO acontece aqui: PDF exige PyMuPDF, que não tem equivalente
// viável no runtime Deno (256 MB de RAM, ~200 ms de CPU, 20 MB de bundle). Quem
// lê o arquivo é o serviço Python de `extractor/`, e é lá que mora o roteador
// por formato — PDF, PPTX, DOCX e imagem entram por lá e saem no mesmo formato.
// Esta função orquestra: valida a posse do job, chama o extrator, chama a IA.
//
// Com `extract_only`, para depois da extração e não chega a chamar a IA. É o
// modo da Fase 1: dá para conferir texto e figuras antes de gastar um token.
//
// POST { job_id } → 202 { accepted: true }
//
// Segredos necessários (supabase secrets set):
//   ANTHROPIC_API_KEY, EXTRACTOR_URL, EXTRACTOR_TOKEN

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

// Qual provedor atende a geração. Um interruptor por secret, não uma camada de
// abstração: são duas funções e um `if`. Serve para depurar o fluxo com a chave
// grátis do Gemini antes de gastar crédito pago, e depois para trocar para o
// vencedor do benchmark sem reescrever nada.
//   supabase secrets set AI_PROVIDER=gemini GEMINI_API_KEY=...
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Em ordem de preferência. Os modelos mais novos são os mais disputados: medido
// em 19/08/2026 na camada grátis, 3.7 e 3.6 devolviam 503 depois de ~30 s de
// espera enquanto o 3.5 respondia em 16 s. Cair para o próximo da lista é mais
// rápido e mais confiável do que insistir no mesmo.
const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.6-flash"];

const IMPORTS_BUCKET = "imports";
const CARD_IMAGES_BUCKET = "card-images";

// Teto de figuras enviadas ao modelo. Era 20, escolhidas por área — o que numa
// apostila sem legendas vira "as 20 maiores" e derruba justo a série didática
// pequena que a extração faz questão de preservar (rizogênese 82×151). 60
// figuras a ~650 tokens de visão custam centavos e o modelo passa a escolher
// entre o material inteiro.
const MAX_PROMPT_IMAGES = 60;
/**
 * Escolhe as figuras que vão ao modelo, espalhadas pelo documento.
 *
 * Ordenar por tamanho concentra tudo nas páginas de prancha grande e deixa
 * capítulos sem representação. Aqui as figuras são agrupadas por página (as
 * melhores de cada uma primeiro) e distribuídas em RODADAS: toda página entrega
 * a sua 1ª figura antes de qualquer página entregar a 2ª, e assim por diante até
 * encher o orçamento.
 *
 * Um teto fixo por página (3) foi testado e recusado: na apostila real ele
 * descartava 63 das 111 figuras enquanto deixava 12 das 60 vagas vazias, e
 * cortava pela metade a série de rizogênese — 5 estágios que vivem todos na
 * página 17. A ordem das rodadas já garante a diversidade sem jogar material
 * fora.
 */
// Teto de texto. Era 120k, e numa apostila de 49 páginas isso entregava só 15
// delas ao modelo — as figuras das outras 34 chegavam SEM o texto que as
// explica, e ele não conseguia ligar uma coisa à outra. Medido com material
// real: subir para o documento inteiro levou de 1 para 7 os cards com figura.
// O teto continua existindo para livro inteiro não estourar o contexto.
const MAX_TEXT_CHARS = 400_000;
// Validade das URLs assinadas do bucket privado. Uma hora cobre com folga a
// revisão logo após a extração; reabrir um job antigo reassina no cliente.
const SIGNED_URL_TTL = 60 * 60;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Status =
  | "queued"
  | "extracting"
  // Terminal quando o job é `extract_only`: extraiu, nada de IA.
  | "extracted"
  | "generating"
  | "assembling"
  | "done"
  | "error";

interface CatalogImage {
  id: number;
  page: number;
  path: string;
  thumb_path: string;
  caption: string | null;
  kind: "embedded" | "page" | "standalone";
  size: [number, number];
}

/** Ressalva da extração: deu certo, mas com algo que o usuário precisa saber. */
interface ExtractionWarning {
  code: string;
  message: string;
}

interface Bundle {
  source: { type: string; pages: number; scanned: boolean; title: string | null };
  pages: { page: number; text: string; tables: string[]; images: number[] }[];
  catalog: CatalogImage[];
  warnings: ExtractionWarning[];
  stats: Record<string, unknown>;
}

interface Job {
  id: string;
  user_id: string;
  source_path: string;
  source_name: string;
  source_mime: string | null;
  extract_only: boolean;
  /** O usuário quer aproveitar as figuras do material? */
  use_images: boolean;
  // Mantido por compatibilidade com a coluna e com o caminho de texto puro
  // (`generate-cards`). O pipeline de documento ignora: todo card sai como
  // flashcard E quiz ao mesmo tempo.
  mode: "flashcards" | "quiz";
  card_count: number;
  language: string;
}

interface GeneratedCard {
  front: string;
  back: string;
  page: number;
  image_id: number | null;
  image_reason: string | null;
  quiz_options: string[];
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ── Prompt ───────────────────────────────────────────────────────────────────

function buildSystemPrompt(
  count: number,
  language: string,
  hasImages: boolean,
): string {
  const base = `Você cria material de estudo a partir de um documento que o aluno enviou.

Regras gerais:
- Gere ATÉ ${count} cards sobre o conteúdo do documento. Este número é TETO, não
  meta: se o material só sustenta 12 boas questões, devolva 12. Preencher a cota
  com pergunta óbvia, repetida, de detalhe irrelevante ou inventada estraga o
  deck inteiro — o aluno perde a confiança no material e para de estudar. Entre
  entregar o número pedido e entregar só o que presta, QUALIDADE GANHA sempre.
- Escreva tudo em ${language}.
- Cada card cobre UMA ideia. Nada de pergunta dupla.
- Use a numeração de página do documento no campo "page".
- Ignore capa, sumário, ficha catalográfica, aviso de direitos autorais e recado
  do autor ("me siga nas redes", contatos). Isso não é conteúdo de estudo.

TODO card é flashcard E quiz ao mesmo tempo:
- "front" é a pergunta, "back" é a resposta correta.
- "quiz_options" traz EXATAMENTE 3 alternativas ERRADAS. Nunca repita a correta.
- As erradas precisam ser PLAUSÍVEIS e do mesmo assunto: outras estruturas da
  mesma região, etapas vizinhas do mesmo processo, valores da mesma ordem.
  Alternativa de assunto alheio entrega a resposta.
- PARIDADE DE FORMA (regra dura): as quatro opções — a correta e as três erradas
  — devem ter comprimento e nível de detalhe equivalentes. A correta NÃO pode ser
  sistematicamente a mais longa nem a mais curta; se der para acertar medindo o
  tamanho da alternativa, o quiz não vale nada. Explicação longa vai no enunciado
  ou no verso, nunca dentro de uma alternativa.`;

  if (!hasImages) {
    return `${base}

Este documento não tem figuras aproveitáveis: devolva "image_id" e
"image_reason" sempre null.`;
  }

  return `${base}

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
  use.`;
}

const CARD_SCHEMA = {
  type: "object",
  properties: {
    cards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: { type: "string" },
          back: { type: "string" },
          page: { type: "integer" },
          // `anyOf` em vez de type: ["integer","null"] — é a forma que os
          // structured outputs aceitam para campo anulável.
          image_id: { anyOf: [{ type: "integer" }, { type: "null" }] },
          // Justificativa do par figura↔pergunta. Obrigar a explicar melhora a
          // escolha e deixa rastro para depurar figura errada.
          image_reason: { anyOf: [{ type: "string" }, { type: "null" }] },
          quiz_options: { type: "array", items: { type: "string" } },
        },
        required: [
          "front",
          "back",
          "page",
          "image_id",
          "image_reason",
          "quiz_options",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["cards"],
  additionalProperties: false,
} as const;

// ── Processamento ────────────────────────────────────────────────────────────

class JobError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

/**
 * Cota por plano. A geração custa dinheiro real (~R$0,36 a R$1,09 por apostila
 * conforme o modelo), então o teto é do NEGÓCIO, não um número técnico.
 *
 * `free` é vitalício de propósito: 5 por mês, para sempre, é uma conta que corre
 * todo mês por usuário que nunca assina — com mil cadastrados vira uma fatura
 * permanente. 5 uma vez é custo de aquisição, gasto uma vez só.
 *
 * `pro` tem teto alto em vez de "ilimitado": ilimitado não existe quando cada
 * uso custa, e é sempre o usuário mais engajado que estoura a margem dele.
 */
const PLAN_QUOTAS: Record<string, { limit: number; lifetime: boolean; label: string }> = {
  free: {
    limit: 5,
    lifetime: true,
    label: "Você usou suas 5 gerações gratuitas. Assine para continuar gerando.",
  },
  pro: {
    limit: 100,
    lifetime: false,
    label: "Você atingiu o limite de 100 gerações neste mês.",
  },
};
/** Job parado mais que isto sem avançar está órfão (Edge Function morreu). */
const STALE_JOB_MINUTES = 10;

/**
 * Cota do plano, contada no BANCO — o app não pode afrouxar o próprio limite.
 *
 * Conta só jobs que chegaram a chamar a IA (extração-apenas não custa nada) e
 * ignora os que falharam: cobrar do usuário por um erro nosso seria injusto.
 * Quando a assinatura existir, o webhook do pagamento só troca `profiles.plan`
 * — nada aqui muda.
 */
async function enforceQuota(admin: SupabaseClient, job: Job): Promise<void> {
  const { data: profile } = await admin
    .from("profiles")
    .select("plan")
    .eq("id", job.user_id)
    .maybeSingle();

  const plan = (profile as { plan?: string } | null)?.plan ?? "free";
  const quota = PLAN_QUOTAS[plan] ?? PLAN_QUOTAS.free;

  let query = admin
    .from("import_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", job.user_id)
    .eq("extract_only", false)
    .neq("id", job.id)
    .in("status", ["generating", "assembling", "done"]);

  if (!quota.lifetime) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", since);
  }

  const { count } = await query;
  if ((count ?? 0) >= quota.limit) {
    throw new JobError("cota_plano", quota.label);
  }
}

/**
 * Marca como erro os jobs que pararam no meio.
 *
 * Uma Edge Function pode morrer (timeout, deploy, falha de rede) e deixar a
 * linha presa em `extracting` para sempre — o app desiste pelo timeout dele, mas
 * a ficha fica suja e conta na cota. Roda a cada novo job em vez de depender de
 * agendador. Usa `updated_at`, não `created_at`: um arquivo grande legítimo
 * ainda em processamento atualiza o status e não pode ser confundido com
 * abandono.
 */
async function sweepStaleJobs(admin: SupabaseClient): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_JOB_MINUTES * 60 * 1000).toISOString();
  await admin
    .from("import_jobs")
    .update({
      status: "error",
      error_code: "interrompido",
      error_message: "O processamento foi interrompido. Tente de novo.",
    })
    .in("status", ["queued", "extracting", "generating", "assembling"])
    .lt("updated_at", cutoff);
}

async function setStatus(
  admin: SupabaseClient,
  jobId: string,
  status: Status,
  patch: Record<string, unknown> = {},
): Promise<void> {
  await admin.from("import_jobs").update({ status, ...patch }).eq("id", jobId);
}

/** Chama o serviço Python e devolve o bundle já lido do bucket. */
async function extractDocument(
  admin: SupabaseClient,
  job: Job,
): Promise<Bundle> {
  const url = Deno.env.get("EXTRACTOR_URL");
  const token = Deno.env.get("EXTRACTOR_TOKEN");
  if (!url || !token) {
    throw new JobError("config", "Serviço de extração não configurado.");
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-extractor-token": token },
    body: JSON.stringify({
      user_id: job.user_id,
      job_id: job.id,
      source_path: job.source_path,
      // O roteador do extrator decide o formato por aqui. Mandar o mime fixo
      // faria todo arquivo entrar como PDF e quebrar PPTX/DOCX/imagem.
      mime: job.source_mime ?? "",
      filename: job.source_name,
      // Renderizar página de PDF digitalizado só serve para a IA LER a página.
      // Sem geração no fluxo, é tempo e storage jogados fora.
      render_scanned_pages: !job.extract_only,
      // Tabelas idem: só o prompt da geração usa, e detectá-las é a parte mais
      // cara do PDF. O preview responde em segundos sem elas.
      extract_tables: !job.extract_only,
      // Miniaturas também são insumo do prompt — no preview só dobrariam os
      // uploads, que são o grosso do tempo do job.
      thumbnails: !job.extract_only && job.use_images !== false,
      // O usuário disse que o material não tem figura aproveitável: nem
      // procurar. Poupa o upload das imagens e metade dos tokens do prompt.
      extract_images: job.use_images !== false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 415) {
      // O serviço já devolve a mensagem pronta e específica ("PowerPoint antigo
      // (.ppt) ainda não é suportado. Exporte como..."), bem mais útil que um
      // texto genérico escrito aqui.
      throw new JobError("formato", extractDetail(detail) ??
        "Este formato de arquivo ainda não é suportado. Exporte como PDF, DOCX ou PPTX.");
    }
    if (response.status === 413) {
      throw new JobError("arquivo_grande", "O arquivo é grande demais.");
    }
    if (response.status === 422) {
      throw new JobError(
        "documento_ilegivel",
        "Não consegui ler o documento. Ele pode estar corrompido ou protegido por senha.",
      );
    }
    if (response.status === 504 || response.status === 524) {
      // 524 é o proxy/túnel desistindo de esperar — a extração pode até ter
      // terminado depois, mas a resposta não chegou.
      throw new JobError(
        "extracao_timeout",
        "A leitura demorou demais para responder. Tente um arquivo menor.",
      );
    }
    // Página de erro HTML de proxy não é mensagem para usuário.
    const clean = detail.trimStart().startsWith("<") ? "" : detail.slice(0, 160);
    throw new JobError("extracao", `Falha na extração (${response.status}). ${clean}`.trim());
  }

  const { bundle_path } = (await response.json()) as { bundle_path: string };
  const { data, error } = await admin.storage.from(IMPORTS_BUCKET).download(bundle_path);
  if (error || !data) {
    throw new JobError("extracao", "Extraí o documento mas não consegui reler o resultado.");
  }
  const bundle = JSON.parse(await data.text()) as Bundle;
  bundle.warnings ??= [];
  return bundle;
}

/** FastAPI embrulha a mensagem em `{"detail": "..."}`. */
function extractDetail(body: string): string | null {
  try {
    const detail = (JSON.parse(body) as { detail?: unknown }).detail;
    return typeof detail === "string" && detail.trim() ? detail : null;
  } catch {
    return null;
  }
}

/**
 * Saída da extração, uniforme para qualquer formato de entrada — é este o
 * contrato que o app consome. As URLs são assinadas porque o bucket `imports` é
 * privado: o material de estudo do usuário nunca vira link público. Só a figura
 * que de fato virar card é copiada para o `card-images` (ver `publishImages`).
 */
async function buildExtraction(
  admin: SupabaseClient,
  job: Job,
  bundle: Bundle,
): Promise<Record<string, unknown>> {
  const folder = `${job.user_id}/${job.id}`;
  const paths = bundle.catalog.map((image) => `${folder}/${image.path}`);

  const { data: signed } = paths.length > 0
    ? await admin.storage.from(IMPORTS_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
    : { data: [] };

  const texto = bundle.pages
    .map((p) => {
      const tables = p.tables.length > 0 ? `\n\n${p.tables.join("\n\n")}` : "";
      return `--- página ${p.page} ---\n${p.text}${tables}`;
    })
    .join("\n\n");

  return {
    texto,
    imagens: bundle.catalog.map((image, index) => ({
      image_id: image.id,
      // O caminho é o que dura: a URL assinada expira, e a tela reassina a
      // partir daqui quando reabre um job antigo.
      path: paths[index],
      url: signed?.[index]?.signedUrl ?? null,
      largura: image.size[0],
      altura: image.size[1],
      pagina: image.page,
      legenda: image.caption,
    })),
    avisos: bundle.warnings,
    fonte: bundle.source,
  };
}

/**
 * Monta o conteúdo do usuário: texto do documento + catálogo de figuras.
 * O rótulo vem ANTES de cada imagem — é assim que o modelo amarra o número
 * à figura que vem em seguida.
 */
function selectImages(catalog: CatalogImage[]): CatalogImage[] {
  const byPage = new Map<number, CatalogImage[]>();
  for (const image of catalog) {
    const list = byPage.get(image.page) ?? [];
    list.push(image);
    byPage.set(image.page, list);
  }

  // Dentro da página: legenda primeiro (perfil de figura didática), depois área.
  for (const list of byPage.values()) {
    list.sort((a, b) => {
      const byCaption = Number(Boolean(b.caption)) - Number(Boolean(a.caption));
      if (byCaption !== 0) return byCaption;
      return b.size[0] * b.size[1] - a.size[0] * a.size[1];
    });
  }

  const pages = [...byPage.keys()].sort((a, b) => a - b);
  const deepest = Math.max(...[...byPage.values()].map((l) => l.length), 0);
  const picked: CatalogImage[] = [];
  for (let round = 0; round < deepest && picked.length < MAX_PROMPT_IMAGES; round++) {
    for (const page of pages) {
      const image = byPage.get(page)![round];
      if (image) picked.push(image);
      if (picked.length >= MAX_PROMPT_IMAGES) break;
    }
  }

  // Na ordem do documento: o modelo lê as figuras junto com o texto.
  return picked.sort((a, b) => a.id - b.id);
}

async function buildUserBlocks(
  admin: SupabaseClient,
  job: { user_id: string; id: string },
  bundle: Bundle,
): Promise<{ blocks: unknown[]; used: CatalogImage[] }> {
  const text = bundle.pages
    .map((p) => {
      const tables = p.tables.length > 0 ? `\n\n${p.tables.join("\n\n")}` : "";
      const figures = p.images.length > 0 ? `\n[figuras nesta página: ${p.images.join(", ")}]` : "";
      return `--- página ${p.page} ---\n${p.text}${tables}${figures}`;
    })
    .join("\n\n")
    .slice(0, MAX_TEXT_CHARS);

  const blocks: unknown[] = [
    {
      type: "text",
      text: bundle.source.scanned
        ? "O documento é digitalizado (só imagens de página). Leia as páginas abaixo para extrair o conteúdo."
        : `Conteúdo do documento:\n\n${text}`,
    },
  ];

  const used = selectImages(bundle.catalog);
  const folder = `${job.user_id}/${job.id}`;

  // Em paralelo, em lotes. Uma de cada vez levava 57 s para 60 miniaturas de
  // 12 KB — o tempo era todo ida e volta de rede, e sozinho estourava o limite
  // de execução da função antes mesmo de a IA ser chamada.
  const DOWNLOAD_BATCH = 12;
  const bytesById = new Map<number, Uint8Array>();
  for (let i = 0; i < used.length; i += DOWNLOAD_BATCH) {
    const lote = used.slice(i, i + DOWNLOAD_BATCH);
    await Promise.all(
      lote.map(async (image) => {
        const { data } = await admin.storage
          .from(IMPORTS_BUCKET)
          .download(`${folder}/${image.thumb_path}`);
        if (data) bytesById.set(image.id, new Uint8Array(await data.arrayBuffer()));
      }),
    );
  }

  // Só as que realmente foram enviadas contam como "vistas pelo modelo": é esta
  // lista que o validador usa para recusar `image_id` de figura inexistente.
  const sent: CatalogImage[] = [];
  for (const image of used) {
    const bytes = bytesById.get(image.id);
    if (!bytes) continue;
    blocks.push({
      type: "text",
      text: `IMAGEM #${image.id} — página ${image.page}${image.caption ? ` — legenda: "${image.caption}"` : ""}`,
    });
    blocks.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: base64(bytes) },
    });
    sent.push(image);
  }

  return { blocks, used: sent };
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000; // btoa não aguenta spread de array grande de uma vez
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Roteia para o provedor configurado. Ambos devolvem o MESMO JSON de cards. */
async function callModel(
  system: string,
  blocks: unknown[],
  count: number,
): Promise<GeneratedCard[]> {
  const provider = (Deno.env.get("AI_PROVIDER") ?? "anthropic").toLowerCase();
  const call = () =>
    provider === "gemini" ? callGemini(system, blocks) : callAnthropic(system, blocks);

  // Uma segunda tentativa, curta. O `callGemini` já percorre vários modelos por
  // conta própria, então insistir mais aqui só faz a FALHA demorar: cada 503 do
  // Gemini leva ~30 s para voltar, e o usuário ficou 2,5 min olhando para uma
  // tela que ia falhar de qualquer jeito.
  let text = "";
  for (let attempt = 1; ; attempt++) {
    try {
      text = await call();
      break;
    } catch (e) {
      const retryable = e instanceof JobError &&
        (e.code === "overloaded" || e.code === "rate_limit");
      if (!retryable || attempt >= 2) throw e;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  let parsed: { cards?: GeneratedCard[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new JobError("resposta_invalida", "A IA devolveu uma resposta inesperada.");
  }

  const cards = (parsed.cards ?? []).filter(
    (c) =>
      typeof c?.front === "string" && c.front.trim() &&
      typeof c?.back === "string" && c.back.trim(),
  );
  if (cards.length === 0) {
    throw new JobError(
      "conteudo_insuficiente",
      "Não consegui extrair conteúdo suficiente deste documento para gerar cards.",
    );
  }
  return cards.slice(0, count);
}

/**
 * Gemini. Mesmo prompt e mesmo schema do caminho da Anthropic — muda só o
 * formato do envelope: `inline_data` em vez de `source.base64`, e o schema vai
 * em `responseJsonSchema`.
 */
async function callGemini(system: string, blocks: unknown[]): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new JobError("config", "GEMINI_API_KEY não configurada.");

  const parts = (blocks as {
    type: string;
    text?: string;
    source?: { data: string };
  }[]).map((b) =>
    b.type === "text"
      ? { text: b.text ?? "" }
      : { inline_data: { mime_type: "image/jpeg", data: b.source?.data ?? "" } }
  );

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: CARD_SCHEMA,
      maxOutputTokens: 16000,
    },
  });

  // Percorre a lista até um modelo aceitar. Sobrecarga (503) e indisponível
  // (404, modelo aposentado) não são erro nosso: é só ir para o próximo.
  let response: Response | null = null;
  for (const model of GEMINI_MODELS) {
    const attempt = await fetch(`${GEMINI_API_BASE}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body,
    });
    // 503 = lotado, 404 = modelo aposentado, 429 = cota diária esgotada. A cota
    // grátis é POR MODELO (20 req/dia cada), então cair para o próximo da lista
    // triplica o que dá para usar num dia — e nenhum dos três é erro nosso.
    const proximo = attempt.status === 503 || attempt.status === 404 ||
      attempt.status === 429;
    if (attempt.ok || !proximo) {
      response = attempt;
      break;
    }
    await attempt.body?.cancel();
  }

  if (!response) {
    throw new JobError(
      "overloaded",
      "A IA está sobrecarregada agora. Tente de novo em um minuto.",
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 429) {
      throw new JobError(
        "rate_limit",
        "O limite diário gratuito da IA foi atingido. Tente de novo amanhã.",
      );
    }
    if (/API key|PERMISSION_DENIED|API_KEY_INVALID/i.test(text)) {
      throw new JobError("invalid_api_key", "A chave da IA foi recusada.");
    }
    throw new JobError("upstream", `Erro na API da IA (${response.status}).`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new JobError("resposta_invalida", "A IA não devolveu conteúdo.");
  }
  if (candidate.finishReason === "SAFETY") {
    throw new JobError("recusado", "A IA recusou gerar material a partir deste documento.");
  }
  return (candidate.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

async function callAnthropic(system: string, blocks: unknown[]): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new JobError("config", "ANTHROPIC_API_KEY não configurada.");

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      // Cabe o raciocínio + os cards. Escolher figura é a parte que pensa.
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        // Schema garantido pela API — nada de recortar JSON de texto na mão.
        format: { type: "json_schema", schema: CARD_SCHEMA },
      },
      system,
      messages: [{ role: "user", content: blocks }],
    }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    const message = err.error?.message ?? "";
    if (/credit balance|billing|purchase/i.test(message)) {
      throw new JobError("no_credits", "Créditos da API esgotados. Tente mais tarde.");
    }
    if (response.status === 429) {
      throw new JobError(
        "rate_limit",
        "O limite diário gratuito da IA foi atingido. Tente de novo amanhã.",
      );
    }
    if (response.status === 529) {
      throw new JobError("overloaded", "A IA está sobrecarregada. Tente em instantes.");
    }
    throw new JobError("upstream", message || `Erro na API da IA (${response.status}).`);
  }

  const data = (await response.json()) as {
    stop_reason?: string;
    content?: { type: string; text?: string }[];
  };

  if (data.stop_reason === "refusal") {
    throw new JobError(
      "recusado",
      "A IA recusou gerar material a partir deste documento.",
    );
  }

  return data.content?.find((b) => b.type === "text")?.text ?? "";
}

/**
 * Copia para o bucket público SÓ as figuras que viraram card. Nome por hash do
 * conteúdo, igual ao upload manual (`services/images.ts`), então a mesma figura
 * usada em dois cards ocupa espaço uma vez só.
 */
/** Quantas vezes a mesma figura pode aparecer no deck. */
const MAX_CARDS_PER_IMAGE = 2;

interface ValidationResult {
  cards: GeneratedCard[];
  dropped: number;
  /** Motivos, para as stats do job — é o que explica "pedi 15 e vieram 13". */
  reasons: Record<string, number>;
}

/**
 * Confere o que o modelo devolveu antes de virar card do usuário.
 *
 * Structured output garante o FORMATO, não a verdade: nada impede o modelo de
 * citar a imagem 999, repetir a correta entre as alternativas ou grudar a mesma
 * prancha em cinco cards. Como o usuário não revisa as figuras separadas, esta
 * é a única barreira entre uma escolha ruim e o deck dele.
 */
function validateCards(
  cards: GeneratedCard[],
  sent: CatalogImage[],
): ValidationResult {
  const validIds = new Set(sent.map((i) => i.id));
  const usePerImage = new Map<number, number>();
  const out: GeneratedCard[] = [];
  const reasons: Record<string, number> = {};

  const drop = (reason: string) => {
    reasons[reason] = (reasons[reason] ?? 0) + 1;
  };

  for (const card of cards) {
    const front = (card.front ?? "").trim();
    const back = (card.back ?? "").trim();
    if (!front || !back) {
      drop("frente ou verso vazio");
      continue;
    }

    const options = (Array.isArray(card.quiz_options) ? card.quiz_options : [])
      .map((o) => (o ?? "").trim())
      .filter(Boolean);
    // Alternativa igual à correta entrega a resposta; repetida idem.
    const unique = [...new Set(options)].filter(
      (o) => o.toLowerCase() !== back.toLowerCase(),
    );
    if (unique.length !== 3) {
      drop("alternativas inválidas");
      continue;
    }

    let imageId = card.image_id;
    let reason = card.image_reason;

    if (imageId != null && !validIds.has(imageId)) {
      // O modelo citou uma figura que não recebeu. O card ainda vale como card
      // de texto — descartar tudo puniria conteúdo bom por causa da figura.
      drop("figura inexistente");
      imageId = null;
      reason = null;
    }
    if (imageId != null && !(reason ?? "").trim()) {
      drop("figura sem justificativa");
      imageId = null;
      reason = null;
    }
    if (imageId != null) {
      const used = usePerImage.get(imageId) ?? 0;
      if (used >= MAX_CARDS_PER_IMAGE) {
        drop("figura repetida demais");
        imageId = null;
        reason = null;
      } else {
        usePerImage.set(imageId, used + 1);
      }
    }
    if (imageId == null) reason = null;

    out.push({
      ...card,
      front,
      back,
      quiz_options: unique,
      image_id: imageId,
      image_reason: reason,
    });
  }

  return { cards: out, dropped: cards.length - out.length, reasons };
}

/**
 * Viés conhecido: o modelo escreve a correta como definição completa e as
 * erradas como fragmentos, e o quiz passa a se resolver medindo o tamanho da
 * alternativa. Por acaso, cada posição deveria ficar perto de 25%.
 */
function answerLengthBias(cards: GeneratedCard[]): Record<string, number> {
  let longest = 0;
  let shortest = 0;
  for (const card of cards) {
    const others = card.quiz_options.map((o) => o.length);
    const correct = card.back.length;
    // Estritamente maior/menor que TODAS as outras. Empate não conta: num quiz
    // bem equilibrado ("Esmalte", "Dentina", "Cemento") as alternativas têm
    // tamanho parecido de propósito, e contar empate marcaria 100% de viés
    // justamente no caso que queremos.
    if (others.every((n) => correct > n)) longest++;
    if (others.every((n) => correct < n)) shortest++;
  }
  const total = Math.max(1, cards.length);
  return {
    correct_is_longest_pct: Math.round((longest / total) * 100),
    correct_is_shortest_pct: Math.round((shortest / total) * 100),
  };
}

async function publishImages(
  admin: SupabaseClient,
  job: { user_id: string; id: string },
  cards: GeneratedCard[],
  catalog: CatalogImage[],
): Promise<Map<number, string>> {
  const byId = new Map(catalog.map((c) => [c.id, c]));
  const wanted = [...new Set(cards.map((c) => c.image_id).filter((id): id is number => id != null))];
  const urls = new Map<number, string>();

  for (const id of wanted) {
    const image = byId.get(id);
    if (!image) continue; // a IA citou um número que não existe: ignora
    const { data } = await admin.storage
      .from(IMPORTS_BUCKET)
      .download(`${job.user_id}/${job.id}/${image.path}`);
    if (!data) continue;

    const bytes = new Uint8Array(await data.arrayBuffer());
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hash = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const path = `${job.user_id}/${hash}.jpg`;

    const { error } = await admin.storage
      .from(CARD_IMAGES_BUCKET)
      .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
    if (error) continue;

    urls.set(id, admin.storage.from(CARD_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

async function process(admin: SupabaseClient, jobId: string): Promise<void> {
  await sweepStaleJobs(admin);

  // Reivindica o job: só sai de `queued` UMA vez. Se outra execução já pegou
  // (retry do cliente, reinvocação, dois toques no botão), o update não casa,
  // não volta linha, e esta sai sem chamar a IA nem cobrar de novo.
  // Compare-and-swap no próprio banco — sem coluna nova, sem trava externa.
  const { data } = await admin
    .from("import_jobs")
    .update({ status: "extracting" })
    .eq("id", jobId)
    .eq("status", "queued")
    .select("*")
    .maybeSingle();

  const job = data as Job | null;
  if (!job) return; // já reivindicado, ou job inexistente

  try {
    const bundle = await extractDocument(admin, job);
    const extraction = await buildExtraction(admin, job, bundle);

    // Fase 1: para aqui. A IA nunca é chamada — dá para conferir o que saiu do
    // arquivo antes de gastar um token com ele.
    if (job.extract_only) {
      await setStatus(admin, jobId, "extracted", {
        extraction,
        stats: bundle.stats,
      });
      return;
    }

    await enforceQuota(admin, job);

    await setStatus(admin, jobId, "generating", { extraction, stats: bundle.stats });
    const { blocks, used } = await buildUserBlocks(admin, job, bundle);
    const system = buildSystemPrompt(job.card_count, job.language, used.length > 0);
    const raw = await callModel(system, blocks, job.card_count);

    // O modelo pode citar figura que não recebeu, repetir a correta entre as
    // alternativas ou grudar a mesma prancha em vários cards: nada disso pode
    // chegar ao usuário, que não revisa as figuras.
    const { cards, dropped, reasons } = validateCards(raw, used);
    if (cards.length === 0) {
      throw new JobError(
        "resposta_invalida",
        "A geração não produziu cards válidos. Tente de novo.",
      );
    }

    await setStatus(admin, jobId, "assembling");
    const urls = await publishImages(admin, job, cards, bundle.catalog);

    const result = cards.map((c) => ({
      front: c.front,
      back: c.back,
      quizOptions: c.quiz_options,
      images: c.image_id != null && urls.has(c.image_id) ? [urls.get(c.image_id)!] : [],
    }));

    await setStatus(admin, jobId, "done", {
      result: { cards: result },
      stats: {
        ...bundle.stats,
        images_sent: used.length,
        cards_with_image: result.filter((c) => c.images.length > 0).length,
        cards_dropped: dropped,
        ...(dropped > 0 ? { dropped_reasons: reasons } : {}),
        ...answerLengthBias(cards),
      },
    });
  } catch (e) {
    const isJobError = e instanceof JobError;
    await setStatus(admin, jobId, "error", {
      error_code: isJobError ? e.code : "desconhecido",
      error_message: isJobError
        ? e.message
        : "Algo deu errado ao gerar os cards. Tente novamente.",
    });
  }
}

// ── Entrada ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed", message: "Use POST." });
  }

  const authorization = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  // Cliente COM o JWT do usuário: a RLS decide se o job é dele. Não dá para
  // confiar no `job_id` que veio no corpo.
  const asUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
  });

  let jobId: string;
  try {
    ({ job_id: jobId } = await req.json());
  } catch {
    return json(400, { error: "bad_request", message: "Body JSON inválido." });
  }
  if (!jobId) {
    return json(400, { error: "bad_request", message: "job_id é obrigatório." });
  }

  const { data: job } = await asUser
    .from("import_jobs")
    .select("id, status")
    .eq("id", jobId)
    .single();
  if (!job) {
    return json(404, { error: "not_found", message: "Trabalho não encontrado." });
  }
  if (job.status !== "queued") {
    return json(409, { error: "ja_iniciado", message: "Este trabalho já foi iniciado." });
  }

  // Service role para o trabalho pesado: precisa ler o bucket privado e
  // escrever no `card-images` em nome do usuário.
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Responde já e continua trabalhando: o app acompanha por `import_jobs`.
  EdgeRuntime.waitUntil(process(admin, jobId));
  return json(202, { accepted: true });
});
