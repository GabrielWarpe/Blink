import * as Crypto from 'expo-crypto';
import { supabase } from '@/services/supabase';
import { base64ToBytes } from '@/services/images';

/**
 * Importação de material de estudo: PDF, PPTX, DOCX ou imagem.
 *
 * O trabalho leva dezenas de segundos (ler o arquivo, separar as figuras e,
 * depois, a IA julgar quais ajudam a memorizar), então não cabe numa requisição
 * que o app segura: sobe o arquivo, cria um job e acompanha o progresso — ver a
 * Edge Function `generate-cards-doc`.
 *
 * Dois caminhos sobre o mesmo trilho:
 *   • `extractDocument` para aqui, com o texto e as figuras extraídas. Sem IA.
 *   • `importDocument` segue até os cards prontos.
 */

export type ImportStatus =
  | 'queued'
  | 'extracting'
  /** Terminal quando o job é só de extração. */
  | 'extracted'
  | 'generating'
  | 'assembling'
  | 'done'
  | 'error';

/** Texto de progresso para a UI — o usuário precisa saber que não travou. */
export const IMPORT_STATUS_LABEL: Record<ImportStatus, string> = {
  queued: 'Enviando o arquivo...',
  extracting: 'Lendo o documento...',
  extracted: 'Pronto!',
  generating: 'Analisando o conteúdo e as figuras...',
  assembling: 'Montando os cards...',
  done: 'Pronto!',
  error: 'Falhou',
};

// ── Formatos ─────────────────────────────────────────────────────────────────

export type SourceKind = 'pdf' | 'pptx' | 'docx' | 'image';

export interface SourceFormat {
  kind: SourceKind;
  mime: string;
  extension: string;
}

const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Aceito pelo seletor de arquivos. Barrar aqui evita upload que já nasce morto. */
export const PICKER_MIME_TYPES = [
  'application/pdf',
  PPTX_MIME,
  DOCX_MIME,
  'image/jpeg',
  'image/png',
];

/**
 * Mesmo teto do serviço de extração (`MAX_SOURCE_MB`). Acima disso o container
 * de 1 GB sofre com PyMuPDF e Pillow trabalhando juntos.
 */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export const FORMAT_HELP =
  'Aceito PDF, PowerPoint (.pptx), Word (.docx) e imagens (JPG/PNG). ' +
  'Se o seu arquivo for de outro tipo, exporte como PDF e tente de novo.';

/** Deduz o formato pelo mimetype/extensão. `null` = não suportado. */
export function detectSourceFormat(
  mimeType: string | null | undefined,
  name: string,
): SourceFormat | null {
  const lower = (name || '').toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (mime === 'application/pdf' || lower.endsWith('.pdf')) {
    return { kind: 'pdf', mime: 'application/pdf', extension: 'pdf' };
  }
  if (mime === PPTX_MIME || lower.endsWith('.pptx')) {
    return { kind: 'pptx', mime: PPTX_MIME, extension: 'pptx' };
  }
  if (mime === DOCX_MIME || lower.endsWith('.docx')) {
    return { kind: 'docx', mime: DOCX_MIME, extension: 'docx' };
  }
  if (lower.endsWith('.png')) {
    return { kind: 'image', mime: 'image/png', extension: 'png' };
  }
  if (mime.startsWith('image/') || /\.(jpe?g|webp|heic)$/.test(lower)) {
    // Normaliza para JPEG: é o que o extrator devolve de qualquer forma.
    return { kind: 'image', mime: 'image/jpeg', extension: 'jpg' };
  }
  return null;
}

// ── Saída ────────────────────────────────────────────────────────────────────

/** Figura extraída, ainda no bucket privado `imports`. */
export interface ExtractedFigure {
  image_id: number;
  /** Caminho no bucket — é o que dura. A URL assinada expira. */
  path: string;
  url: string | null;
  largura: number;
  altura: number;
  pagina: number;
  legenda: string | null;
}

/** Ressalva da extração: deu certo, mas com algo que o usuário precisa saber. */
export interface ExtractionWarning {
  code: string;
  message: string;
}

/** Saída da extração — a MESMA forma para qualquer formato de entrada. */
export interface Extraction {
  texto: string;
  imagens: ExtractedFigure[];
  avisos: ExtractionWarning[];
  fonte: { type: string; pages: number; scanned: boolean; title: string | null };
}

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
  chars?: number;
  scanned?: boolean;
  vector_pages?: number[];
}

export type ImportResult =
  | { ok: true; cards: ImportedCard[]; stats: ImportStats }
  | { ok: false; code: string; message: string };

export type ExtractResult =
  | { ok: true; jobId: string; extraction: Extraction; stats: ImportStats }
  | { ok: false; code: string; message: string };

interface StartParams {
  /** Conteúdo do arquivo em base64 (o picker já entrega assim). */
  base64: string;
  name: string;
  format: SourceFormat;
  mode?: 'flashcards' | 'quiz';
  count?: number;
  language?: string;
  /** Para na extração, sem chamar a IA. */
  extractOnly?: boolean;
}

const BUCKET = 'imports';
const POLL_INTERVAL_MS = 1500;
/** Teto de espera. Documento grande é lento, mas 5 min é sinal de travamento. */
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const FALLBACK_MESSAGE = 'Não foi possível processar o arquivo. Tente novamente.';

/**
 * Sobe o arquivo, cria o job e dispara o processamento. Devolve o id para
 * acompanhar com `watch`.
 */
async function start(params: StartParams): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('Sessão expirada. Entre de novo.');

  // O id do job também é o diretório no bucket — gerar antes evita um
  // vai-e-volta só para descobrir onde salvar.
  // `Crypto` do expo, não o `crypto` global: no navegador o global existe, mas
  // no celular (Hermes) não — quebrava com "Property 'crypto' doesn't exist".
  const jobId = Crypto.randomUUID();
  const sourcePath = `${userId}/${jobId}/source.${params.format.extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(sourcePath, base64ToBytes(params.base64), {
      contentType: params.format.mime,
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
    // É por aqui que o roteador do extrator escolhe o formato.
    source_mime: params.format.mime,
    extract_only: params.extractOnly ?? false,
    mode: params.mode ?? 'flashcards',
    card_count: params.count ?? 10,
    language: params.language ?? 'pt-BR',
  });
  if (jobError) throw new Error(`Falha ao criar o trabalho: ${jobError.message}`);

  const { error: invokeError } = await supabase.functions.invoke(
    'generate-cards-doc',
    { body: { job_id: jobId } },
  );
  if (invokeError) {
    throw new Error('Não consegui iniciar o processamento. Verifique sua conexão.');
  }

  return jobId;
}

interface JobRow {
  status: ImportStatus;
  result: { cards?: ImportedCard[] } | null;
  extraction: Extraction | null;
  stats: ImportStats | null;
  error_code: string | null;
  error_message: string | null;
}

/**
 * Acompanha o job até chegar a `until` (ou erro). `onStatus` recebe cada
 * transição para a UI mostrar em que pé está.
 */
async function watch(
  jobId: string,
  until: ImportStatus,
  onStatus?: (status: ImportStatus) => void,
): Promise<{ ok: true; row: JobRow } | { ok: false; code: string; message: string }> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let last: ImportStatus | null = null;

  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from('import_jobs')
      .select('status, result, extraction, stats, error_code, error_message')
      .eq('id', jobId)
      .single();

    if (error) {
      return { ok: false, code: 'network', message: 'Perdi contato com o servidor.' };
    }

    const row = data as JobRow;
    if (row.status !== last) {
      last = row.status;
      onStatus?.(row.status);
    }

    if (row.status === until) return { ok: true, row };
    if (row.status === 'error') {
      return {
        ok: false,
        code: row.error_code ?? 'desconhecido',
        message: row.error_message ?? FALLBACK_MESSAGE,
      };
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return {
    ok: false,
    code: 'timeout',
    message: 'O processamento demorou demais. Tente um arquivo menor.',
  };
}

/**
 * FASE 1: sobe o arquivo e devolve o que saiu dele — texto e figuras — sem
 * nenhuma chamada de IA.
 */
export async function extractDocument(
  params: Omit<StartParams, 'extractOnly' | 'mode' | 'count'>,
  onStatus?: (status: ImportStatus) => void,
): Promise<ExtractResult> {
  try {
    const jobId = await start({ ...params, extractOnly: true });
    const result = await watch(jobId, 'extracted', onStatus);
    if (!result.ok) return result;

    const extraction = result.row.extraction;
    if (!extraction) {
      return {
        ok: false,
        code: 'resposta_invalida',
        message: 'A extração terminou mas não devolveu conteúdo.',
      };
    }
    return {
      ok: true,
      jobId,
      extraction: { ...extraction, avisos: extraction.avisos ?? [] },
      stats: result.row.stats ?? {},
    };
  } catch (e) {
    return {
      ok: false,
      code: 'upload',
      message: e instanceof Error ? e.message : FALLBACK_MESSAGE,
    };
  }
}

/** Sobe, processa e devolve os cards prontos (com IA). */
export async function importDocument(
  params: StartParams,
  onStatus?: (status: ImportStatus) => void,
): Promise<ImportResult> {
  try {
    const jobId = await start({ ...params, extractOnly: false });
    const result = await watch(jobId, 'done', onStatus);
    if (!result.ok) return result;
    return {
      ok: true,
      cards: result.row.result?.cards ?? [],
      stats: result.row.stats ?? {},
    };
  } catch (e) {
    return {
      ok: false,
      code: 'upload',
      message: e instanceof Error ? e.message : FALLBACK_MESSAGE,
    };
  }
}

/**
 * Reassina as URLs das figuras. As que vêm do job expiram em uma hora — ao
 * reabrir uma extração antiga, o caminho continua válido e é dele que sai a
 * URL nova.
 */
export async function signFigures(
  figures: ExtractedFigure[],
): Promise<ExtractedFigure[]> {
  if (figures.length === 0) return figures;
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(figures.map(f => f.path), 60 * 60);
  if (!data) return figures;
  return figures.map((figure, index) => ({
    ...figure,
    url: data[index]?.signedUrl ?? figure.url,
  }));
}
