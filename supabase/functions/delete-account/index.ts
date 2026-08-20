// Supabase Edge Function: EXCLUSÃO DEFINITIVA DA CONTA.
//
// Existe por exigência de loja: a diretriz 5.1.1(v) da Apple obriga todo app que
// cria conta a oferecer a exclusão DENTRO do app — mandar o usuário escrever
// para o suporte é motivo de recusa. O Google Play pede o mesmo desde 2024.
//
// Por que uma Edge Function e não uma chamada do app: apagar a linha de
// `auth.users` exige a chave `service_role`, que nunca pode viver no cliente.
// O app manda o próprio token; aqui ele é validado e só então a conta cai.
//
// O que é apagado, em ordem:
//   1. Arquivos do Storage (`imports/{uid}/…` e `card-images/{uid}/…`)
//   2. A linha de `auth.users` — o resto do banco vem junto por CASCADE
//      (`profiles` referencia `auth.users on delete cascade`, e todas as outras
//      tabelas referenciam `profiles` do mesmo jeito: decks, cards, revisões,
//      publicações na comunidade, avaliações, denúncias, jobs de importação).
//
// A ordem importa: se a conta caísse primeiro, o `user_id` sumiria e não
// haveria como descobrir quais arquivos eram dele — ficariam órfãos pagando
// armazenamento para sempre.
//
// POST (sem corpo), com Authorization: Bearer <token do usuário>
//   → 200 { deleted: true, files: <n> }

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Buckets que guardam arquivo por usuário, sempre sob o prefixo `{uid}/`. */
const USER_BUCKETS = ["imports", "card-images"] as const;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/**
 * Lista TODOS os caminhos sob um prefixo, descendo nas subpastas.
 *
 * O `list` do Storage não é recursivo: numa pasta ele devolve os arquivos e as
 * subpastas misturados, e subpasta vem sem `id`. É por esse `id` que dá para
 * separar um do outro — sem descer, `imports/{uid}/{job}/img/0003.png` nunca
 * seria encontrado e o material do usuário continuaria armazenado depois de
 * ele ter pedido para sumir.
 */
async function listAllPaths(
  storage: ReturnType<typeof createClient>["storage"],
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const encontrados: string[] = [];
  const pendentes = [prefix];

  while (pendentes.length > 0) {
    const atual = pendentes.pop()!;
    const { data, error } = await storage
      .from(bucket)
      .list(atual, { limit: 1000 });
    // Bucket ausente ou pasta vazia não é motivo para abortar a exclusão da
    // conta — o que não existe já está no estado desejado.
    if (error || !data) continue;

    for (const item of data) {
      const caminho = `${atual}/${item.name}`;
      if (item.id == null) pendentes.push(caminho);
      else encontrados.push(caminho);
    }
  }
  return encontrados;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json(405, { error: "Método não permitido" });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json(401, { error: "nao_autenticado" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Quem é o dono do token? Validado CONTRA O SERVIDOR (`getUser` bate no
  // endpoint de auth), não decodificando o JWT aqui — um token expirado ou
  // forjado precisa falhar, e só o servidor sabe disso.
  const asUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: auth, error: authError } = await asUser.auth.getUser();
  const userId = auth?.user?.id;
  if (authError || !userId) return json(401, { error: "nao_autenticado" });

  const admin = createClient(supabaseUrl, serviceKey);

  // 1. Arquivos. Uma falha aqui NÃO impede a exclusão da conta: entre deixar o
  // usuário preso a uma conta que ele pediu para apagar e deixar alguns
  // arquivos órfãos, a conta some. O número volta na resposta para dar rastro.
  let apagados = 0;
  for (const bucket of USER_BUCKETS) {
    try {
      const caminhos = await listAllPaths(admin.storage, bucket, userId);
      // O `remove` aceita lote; 1000 por vez é o teto prático da API.
      for (let i = 0; i < caminhos.length; i += 1000) {
        const lote = caminhos.slice(i, i + 1000);
        const { error } = await admin.storage.from(bucket).remove(lote);
        if (!error) apagados += lote.length;
      }
    } catch (e) {
      console.error(`[delete-account] storage ${bucket}:`, e);
    }
  }

  // 2. A conta. Leva junto, por CASCADE, tudo que referencia `profiles`.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("[delete-account] deleteUser:", deleteError);
    return json(500, {
      error: "falha_exclusao",
      message: "Não foi possível excluir a conta. Tente novamente.",
    });
  }

  return json(200, { deleted: true, files: apagados });
});
