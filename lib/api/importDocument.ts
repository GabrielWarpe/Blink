import { supabase } from '@/services/supabase';
import { base64ToBytes } from '@/services/images';

/**
 * Geração de cards a partir de um DOCUMENTO (hoje: PDF), com as figuras do
 * próprio arquivo.
 *
 * Fluxo diferente do `generateCards`: aqui o trabalho leva dezenas de segundos
 * (extrair o PDF, o modelo julgar as figuras, copiar as escolhidas), então não
 * cabe numa requisição que o app segura. O app sobe o arquivo, cria um job e
 * acompanha o progresso — ver a Edge Function `generate-cards-doc`.
 */

export type ImportStatus =
  | 'queued'
  | 'extracting'
  | 'generating'
  | 'assembling'
  | 'done'
  | 'error';

/** Texto de progresso para a UI — o usuário precisa saber que não travou. */
export const IMPORT_STATUS_LABEL: Record<ImportStatus, string> = {
  queued: 'Preparando...',
  extracting: 'Lendo o documento...',
  generating: 'Analisando o conteúdo e as figuras...',
  assembling: 'Montando os cards...',
  done: 'Pronto!',
  error: 'Falhou',
};

export interface ImportedCard {
  front: string;
  back: string;
  quizOptions: string[];
  /** URLs já hospedadas no bucket `card-images`. */
  images: string[];
}

export interface ImportStats {
  pages?: number;
  images_found?: number;
  images_kept?: number;
  images_sent?: number;
  cards_with_image?: number;
  scanned?: boolean;
}

export type ImportResult =
  | { ok: true; cards: ImportedCard[]; stats: ImportStats }
  | { ok: false; code: string; message: string };

interface StartParams {
  /** Conteúdo do arquivo em base64 (o picker já entrega assim). */
  base64: string;
  name: string;
  mode: 'flashcards' | 'quiz';
  count: number;
  language?: string;
}

const BUCKET = 'imports';
const POLL_INTERVAL_MS = 1500;
/** Teto de espera. Documento grande é lento, mas 5 min é sinal de travamento. */
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const FALLBACK_MESSAGE = 'Não foi possível gerar os cards agora. Tente novamente.';

/**
 * Sobe o arquivo, cria o job e dispara o processamento. Devolve o id para
 * acompanhar com `watchImport`.
 */
async function start(params: StartParams): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('Sessão expirada. Entre de novo.');

  // O id do job também é o diretório no bucket — gerar antes evita um
  // vai-e-volta só para descobrir onde salvar.
  const jobId = crypto.randomUUID();
  const sourcePath = `${userId}/${jobId}/source.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(sourcePath, base64ToBytes(params.base64), {
      contentType: 'application/pdf',
      upsert: true,
    });
  if (uploadError) {
    throw new Error(
      /bucket/i.test(uploadError.message)
        ? 'O bucket "imports" não existe no Supabase. Rode o schema.sql atualizado.'
        : `Falha ao enviar o arquivo: ${uploadError.message}`,
    );
  }

  const { error: jobError } = await supabase.from('import_jobs').insert({
    id: jobId,
    user_id: userId,
    status: 'queued',
    source_name: params.name,
    source_path: sourcePath,
    mode: params.mode,
    card_count: params.count,
    language: params.language ?? 'pt-BR',
  });
  if (jobError) throw new Error(`Falha ao criar o trabalho: ${jobError.message}`);

  const { error: invokeError } = await supabase.functions.invoke(
    'generate-cards-doc',
    { body: { job_id: jobId } },
  );
  if (invokeError) {
    throw new Error('Não consegui iniciar a geração. Verifique sua conexão.');
  }

  return jobId;
}

/**
 * Acompanha o job até terminar. `onStatus` recebe cada transição para a UI
 * mostrar em que pé está.
 */
async function watch(
  jobId: string,
  onStatus?: (status: ImportStatus) => void,
): Promise<ImportResult> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let last: ImportStatus | null = null;

  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from('import_jobs')
      .select('status, result, stats, error_code, error_message')
      .eq('id', jobId)
      .single();

    if (error) {
      return { ok: false, code: 'network', message: 'Perdi contato com o servidor.' };
    }

    const status = data.status as ImportStatus;
    if (status !== last) {
      last = status;
      onStatus?.(status);
    }

    if (status === 'done') {
      const cards = (data.result?.cards ?? []) as ImportedCard[];
      return { ok: true, cards, stats: (data.stats ?? {}) as ImportStats };
    }
    if (status === 'error') {
      return {
        ok: false,
        code: data.error_code ?? 'desconhecido',
        message: data.error_message ?? FALLBACK_MESSAGE,
      };
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return {
    ok: false,
    code: 'timeout',
    message: 'A geração demorou demais. Tente um arquivo menor.',
  };
}

/** Sobe, processa e devolve os cards prontos. */
export async function importDocument(
  params: StartParams,
  onStatus?: (status: ImportStatus) => void,
): Promise<ImportResult> {
  try {
    const jobId = await start(params);
    return await watch(jobId, onStatus);
  } catch (e) {
    return {
      ok: false,
      code: 'upload',
      message: e instanceof Error ? e.message : FALLBACK_MESSAGE,
    };
  }
}
