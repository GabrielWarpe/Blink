// Supabase Edge Function: geração de cards A PARTIR DE DOCUMENTO, com imagens.
//
// Diferente da `generate-cards` (que segue viva para texto/foto/.docx e responde
// na hora), aqui o trabalho é longo demais para uma requisição: extrair o PDF,
// mandar as figuras para o modelo julgar e copiar as escolhidas leva dezenas de
// segundos. Então o app cria uma linha em `import_jobs`, esta função responde
// 202 na hora e segue trabalhando em segundo plano (`EdgeRuntime.waitUntil`),
// atualizando o `status` — que é o que o app fica lendo para mostrar progresso.
//
// POST { job_id } → 202 { accepted: true }
//
// Segredos necessários (supabase secrets set):
//   ANTHROPIC_API_KEY, EXTRACTOR_URL, EXTRACTOR_TOKEN

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

const IMPORTS_BUCKET = "imports";
const CARD_IMAGES_BUCKET = "card-images";

// Teto de figuras enviadas ao modelo. Cada uma custa tokens de visão, e passar
// de ~20 não melhora a escolha — só encarece.
const MAX_PROMPT_IMAGES = 20;
// Teto de texto. Sonnet 5 tem 1M de contexto, mas mandar um livro inteiro
// custa caro e dilui o foco.
const MAX_TEXT_CHARS = 120_000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Status =
  | "queued"
  | "extracting"
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
  kind: "embedded" | "page";
  size: [number, number];
}

interface Bundle {
  source: { type: string; pages: number; scanned: boolean; title: string | null };
  pages: { page: number; text: string; tables: string[]; images: number[] }[];
  catalog: CatalogImage[];
  stats: Record<string, unknown>;
}

interface GeneratedCard {
  front: string;
  back: string;
  page: number;
  image_id: number | null;
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
  mode: "flashcards" | "quiz",
  count: number,
  language: string,
  hasImages: boolean,
): string {
  const base = `Você cria material de estudo a partir de um documento que o aluno enviou.

Regras gerais:
- Gere EXATAMENTE ${count} ${mode === "flashcards" ? "flashcards" : "questões de múltipla escolha"} sobre o conteúdo do documento.
- Escreva tudo em ${language}.
- Cada item cobre UMA ideia. Nada de pergunta dupla.
- Use a numeração de página do documento no campo "page".
${
    mode === "quiz"
      ? `- Em "quiz_options", devolva EXATAMENTE 3 alternativas ERRADAS mas plausíveis, no mesmo estilo e tamanho da correta (que vai em "back"). Nunca repita a correta entre elas.\n`
      : `- Deixe "quiz_options" como lista vazia.\n`
  }`;

  if (!hasImages) {
    return `${base}- Este documento não tem figuras aproveitáveis: devolva "image_id" sempre null.`;
  }

  return `${base}
Sobre as FIGURAS:
Você recebeu as figuras do documento numeradas (IMAGEM #1, #2…). Em cada card,
"image_id" é o número de UMA figura, ou null.

- Anexe uma figura SOMENTE quando ela ajuda a memorizar: diagrama, esquema,
  fluxograma, mapa, gráfico, figura anatômica, ilustração explicativa, tabela
  que vale como imagem. Nunca por estética.
- Escolha pelo SIGNIFICADO, não pela proximidade. Leia a legenda, o texto ao
  redor e as referências ("ver figura 2") antes de decidir. A figura da página
  certa pode ser a errada para aquele card.
- Quando a figura sozinha basta para formular a pergunta, escreva a FRENTE como
  pergunta de identificação — "Que estrutura está indicada?", "Que fase do ciclo
  esta figura representa?" — e a resposta no verso. Use este formato só quando a
  figura for inequívoca: se ela mostra vinte estruturas e a pergunta é sobre uma,
  faça uma pergunta comum com a figura de apoio.
- Uma figura pode servir a mais de um card, mas não repita a mesma pergunta.
- Prefira QUALIDADE a cobertura: é muito melhor 3 cards com figura realmente
  útil do que 15 com figura decorativa. Na dúvida, "image_id": null.`;
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
          quiz_options: { type: "array", items: { type: "string" } },
        },
        required: ["front", "back", "page", "image_id", "quiz_options"],
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
  job: { id: string; user_id: string; source_path: string; source_name: string },
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
      mime: "application/pdf",
      filename: job.source_name,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 415) {
      throw new JobError("formato", "Este formato de arquivo ainda não é suportado.");
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
    throw new JobError("extracao", `Falha na extração (${response.status}). ${detail.slice(0, 160)}`);
  }

  const { bundle_path } = (await response.json()) as { bundle_path: string };
  const { data, error } = await admin.storage.from(IMPORTS_BUCKET).download(bundle_path);
  if (error || !data) {
    throw new JobError("extracao", "Extraí o documento mas não consegui reler o resultado.");
  }
  return JSON.parse(await data.text()) as Bundle;
}

/**
 * Monta o conteúdo do usuário: texto do documento + catálogo de figuras.
 * O rótulo vem ANTES de cada imagem — é assim que o modelo amarra o número
 * à figura que vem em seguida.
 */
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

  // Prioriza figura com legenda e maior — é o perfil de figura didática.
  const ranked = [...bundle.catalog].sort((a, b) => {
    const byCaption = Number(Boolean(b.caption)) - Number(Boolean(a.caption));
    if (byCaption !== 0) return byCaption;
    return b.size[0] * b.size[1] - a.size[0] * a.size[1];
  });
  const used = ranked.slice(0, MAX_PROMPT_IMAGES).sort((a, b) => a.id - b.id);

  const folder = `${job.user_id}/${job.id}`;
  for (const image of used) {
    const { data } = await admin.storage
      .from(IMPORTS_BUCKET)
      .download(`${folder}/${image.thumb_path}`);
    if (!data) continue;
    const bytes = new Uint8Array(await data.arrayBuffer());
    blocks.push({
      type: "text",
      text: `IMAGEM #${image.id} — página ${image.page}${image.caption ? ` — legenda: "${image.caption}"` : ""}`,
    });
    blocks.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: base64(bytes) },
    });
  }

  return { blocks, used };
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000; // btoa não aguenta spread de array grande de uma vez
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function callModel(
  system: string,
  blocks: unknown[],
  count: number,
): Promise<GeneratedCard[]> {
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
      throw new JobError("rate_limit", "Muitas gerações seguidas. Tente em instantes.");
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

  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  let parsed: { cards?: GeneratedCard[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new JobError("resposta_invalida", "A IA devolveu uma resposta inesperada.");
  }

  const cards = (parsed.cards ?? []).filter(
    (c) => typeof c?.front === "string" && c.front.trim() && typeof c?.back === "string" && c.back.trim(),
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
 * Copia para o bucket público SÓ as figuras que viraram card. Nome por hash do
 * conteúdo, igual ao upload manual (`services/images.ts`), então a mesma figura
 * usada em dois cards ocupa espaço uma vez só.
 */
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
  const { data: job } = await admin
    .from("import_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (!job) return;

  try {
    await setStatus(admin, jobId, "extracting");
    const bundle = await extractDocument(admin, job);

    await setStatus(admin, jobId, "generating", { stats: bundle.stats });
    const { blocks, used } = await buildUserBlocks(admin, job, bundle);
    const system = buildSystemPrompt(
      job.mode,
      job.card_count,
      job.language,
      used.length > 0,
    );
    const cards = await callModel(system, blocks, job.card_count);

    await setStatus(admin, jobId, "assembling");
    const urls = await publishImages(admin, job, cards, bundle.catalog);

    const result = cards.map((c) => ({
      front: c.front,
      back: c.back,
      quizOptions: Array.isArray(c.quiz_options) ? c.quiz_options.slice(0, 3) : [],
      images: c.image_id != null && urls.has(c.image_id) ? [urls.get(c.image_id)!] : [],
    }));

    await setStatus(admin, jobId, "done", {
      result: { cards: result },
      stats: {
        ...bundle.stats,
        images_sent: used.length,
        cards_with_image: result.filter((c) => c.images.length > 0).length,
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
