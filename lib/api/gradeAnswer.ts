import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

/**
 * Cliente da Edge Function `grade-answer` (correção SEMÂNTICA das respostas do
 * modo "Escrever" — a chave da Anthropic vive no secret do Supabase, não no
 * app). Mesmo formato discriminado de `generateCards`.
 *
 * Quem chama NUNCA deve travar a sessão por causa disto: em qualquer falha
 * (offline, sem chave, limite), o comparador local decide. Ver `checkAnswer`.
 */

export type GradeErrorCode =
  | 'no_credits'
  | 'rate_limit'
  | 'invalid_api_key'
  | 'overloaded'
  | 'resposta_invalida'
  | 'bad_request'
  | 'config'
  | 'upstream'
  | 'network'
  | 'timeout'
  | 'unknown';

export type GradeResult =
  | { ok: true; correct: boolean; feedback: string }
  | { ok: false; code: GradeErrorCode };

interface GradeParams {
  question: string;
  expected: string;
  answer: string;
  language?: string;
}

/**
 * Teto de espera. Sem isto, uma rede ruim deixaria o usuário olhando um
 * spinner sem fim — passado o limite, a tela cai no comparador local.
 */
const TIMEOUT_MS = 9000;

export async function gradeAnswer({
  question,
  expected,
  answer,
  language = 'pt-BR',
}: GradeParams): Promise<GradeResult> {
  const call = supabase.functions.invoke('grade-answer', {
    body: { question, expected, answer, language },
  });

  const timeout = new Promise<'timeout'>(resolve =>
    setTimeout(() => resolve('timeout'), TIMEOUT_MS),
  );

  const race = await Promise.race([call, timeout]);
  if (race === 'timeout') return { ok: false, code: 'timeout' };

  const { data, error } = race;

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = (await error.context.json().catch(() => null)) as {
        error?: string;
      } | null;
      return { ok: false, code: (body?.error as GradeErrorCode) ?? 'unknown' };
    }
    return { ok: false, code: 'network' };
  }

  const payload = data as { correct?: boolean; feedback?: string };
  if (typeof payload?.correct !== 'boolean') {
    return { ok: false, code: 'resposta_invalida' };
  }

  return {
    ok: true,
    correct: payload.correct,
    feedback: payload.feedback ?? '',
  };
}
