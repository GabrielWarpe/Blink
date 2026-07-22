// Supabase Edge Function: avalia SEMANTICAMENTE uma resposta escrita pelo aluno
// (modo "Escrever"). A chave fica no secret ANTHROPIC_API_KEY — nunca no app.
//
// Existe porque a comparação por texto (Levenshtein) só funciona para respostas
// curtas: numa definição de uma frase inteira, exigir transcrição literal
// reprova quem sabe a matéria.
//
// POST { question: string, expected: string, answer: string, language?: string }
//
// 200 → { correct: boolean, feedback: string }
// 4xx/5xx → { error: string (código estável), message: string (para a UI) }

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
// Haiku: barato e rápido — o julgamento é uma tarefa curta e objetiva, e a
// latência aparece direto na cara do usuário esperando o "Verificar".
const MODEL = "claude-haiku-4-5-20251001";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Limites de tamanho: evita mandar um texto gigante para a API por engano. */
const MAX_FIELD = 2000;

interface GradeRequest {
  question: string;
  expected: string;
  answer: string;
  language?: string;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function buildSystemPrompt(language: string): string {
  return `Você corrige respostas de flashcards, avaliando SIGNIFICADO, não texto literal.

Receberá: a PERGUNTA, a RESPOSTA ESPERADA e a RESPOSTA DO ALUNO.

Considere CORRETA quando o aluno demonstra saber o conteúdo essencial:
- sinônimos, paráfrase, ordem diferente das palavras, mais ou menos detalhe;
- resposta mais curta que a esperada, desde que contenha o núcleo do conceito;
- erros de digitação, acentuação ou gramática.

Considere INCORRETA quando:
- falta o elemento essencial da resposta esperada, mesmo que parte esteja certa;
- o conceito é outro, ou está genérico/vago demais para mostrar conhecimento;
- o aluno apenas repete a pergunta, ou escreve que não sabe.

Seja justo, não generoso: na dúvida entre "sabia mas explicou mal" e "não
sabia", olhe se o núcleo do conceito aparece.

Responda APENAS com JSON válido, sem markdown e sem texto antes ou depois:
{ "correct": boolean, "feedback": string }

O "feedback" é UMA frase curta (máx. 140 caracteres) em ${language}, dirigida ao
aluno. Se correta, confirme o que ele acertou. Se incorreta, diga OBJETIVAMENTE
o que faltou — nunca apenas "resposta errada".`;
}

/** Remove cercas ```json e extrai o primeiro objeto JSON do texto. */
function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("sem JSON na resposta");
  const candidate = cleaned.slice(start);
  try {
    return JSON.parse(candidate);
  } catch {
    const end = candidate.lastIndexOf("}");
    return JSON.parse(candidate.slice(0, end + 1));
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed", message: "Use POST." });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return json(500, {
      error: "config",
      message:
        "ANTHROPIC_API_KEY não configurada. Rode: supabase secrets set ANTHROPIC_API_KEY=...",
    });
  }

  let body: GradeRequest;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "bad_request", message: "Body JSON inválido." });
  }

  const question = String(body.question ?? "").slice(0, MAX_FIELD);
  const expected = String(body.expected ?? "").slice(0, MAX_FIELD);
  const answer = String(body.answer ?? "").slice(0, MAX_FIELD);
  const language = body.language || "pt-BR";

  if (expected.trim().length === 0 || answer.trim().length === 0) {
    return json(400, {
      error: "bad_request",
      message: "expected e answer são obrigatórios.",
    });
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      system: buildSystemPrompt(language),
      messages: [
        {
          role: "user",
          content: `PERGUNTA: ${question}\n\nRESPOSTA ESPERADA: ${expected}\n\nRESPOSTA DO ALUNO: ${answer}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as {
      error?: { type?: string; message?: string };
    };
    const upstreamMsg = err.error?.message ?? "";

    if (/credit balance|billing|purchase/i.test(upstreamMsg)) {
      return json(402, {
        error: "no_credits",
        message: "Créditos da API esgotados.",
      });
    }
    if (response.status === 401) {
      return json(500, {
        error: "invalid_api_key",
        message: "Erro de configuração do servidor (chave da API inválida).",
      });
    }
    if (response.status === 429) {
      return json(429, {
        error: "rate_limit",
        message: "Muitas correções em sequência. Tente de novo em instantes.",
      });
    }
    if (response.status === 529) {
      return json(503, {
        error: "overloaded",
        message: "A IA está sobrecarregada agora.",
      });
    }
    return json(502, {
      error: "upstream",
      message: upstreamMsg || `Erro na API da IA (${response.status}).`,
    });
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((b) => b.type === "text")?.text ?? "";

  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch {
    return json(500, {
      error: "resposta_invalida",
      message: "A IA não retornou JSON válido.",
    });
  }

  const result = parsed as { correct?: unknown; feedback?: unknown };
  if (typeof result.correct !== "boolean") {
    return json(500, {
      error: "resposta_invalida",
      message: "A resposta da IA não segue o formato esperado.",
    });
  }

  return json(200, {
    correct: result.correct,
    feedback:
      typeof result.feedback === "string" ? result.feedback.slice(0, 240) : "",
  });
});
