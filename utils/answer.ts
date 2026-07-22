/**
 * Comparação tolerante de respostas digitadas (modo "Escrever").
 *
 * Três camadas, da mais barata para a mais cara:
 *   1. texto normalizado idêntico             → 'exact'
 *   2. 1 erro de digitação (respostas curtas) → 'typo'
 *   3. cobertura de PALAVRAS-CHAVE            → 'close' | 'partial' | 'wrong'
 *
 * A camada 3 existe porque as duas primeiras são inúteis em respostas longas:
 * exigir distância ≤ 1 numa frase inteira é exigir transcrição literal, o que
 * reprova justamente quem sabe a matéria mas escreveu com as próprias palavras.
 * Ela compara só as palavras SIGNIFICATIVAS (artigos, preposições e conectivos
 * saem), então ordem das palavras e ligação não contam.
 *
 * Limitação conhecida: mede quantas palavras esperadas apareceram, não se a
 * frase faz sentido — despejar muitas palavras infla a cobertura, e sinônimos
 * ("jornada" por "viagem") não são reconhecidos. Quem resolve esses dois casos
 * é a avaliação semântica por IA, quando disponível.
 */

export type AnswerVerdict = 'exact' | 'typo' | 'close' | 'partial' | 'wrong';

export interface AnswerCheck {
  verdict: AnswerVerdict;
  /** Fração das palavras significativas esperadas que apareceram (0–1). */
  coverage: number;
  /** Palavras significativas esperadas que NÃO apareceram — vira dica na tela. */
  missing: string[];
}

/** Cobertura a partir da qual a resposta conta como certa sem pedir nada a mais. */
const COVERAGE_CORRECT = 0.8;
/** Abaixo disto não há o que aproveitar: é erro. Entre os dois, é ambíguo. */
const COVERAGE_FLOOR = 0.4;
/** Só a partir deste tamanho duas palavras podem casar com 1 letra de diferença
 * (cobre plural e acento perdido sem confundir palavras curtas parecidas). */
const FUZZY_MIN_LEN = 4;

/**
 * Palavras sem carga semântica — a resposta não deve ser julgada por elas.
 * Já na forma NORMALIZADA (minúsculas, sem acento), que é como chegam aqui.
 */
const STOPWORDS = new Set([
  // artigos e contrações
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
  'ao', 'aos', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas',
  'num', 'numa', 'pelo', 'pela', 'pelos', 'pelas', 'dele', 'dela',
  // preposições e conjunções
  'de', 'em', 'por', 'para', 'pra', 'com', 'sem', 'sob', 'sobre',
  'entre', 'ate', 'apos', 'ante', 'desde', 'contra', 'e', 'ou', 'mas',
  'que', 'se', 'como', 'quando', 'porque', 'pois', 'entao', 'tambem',
  // verbos de ligação e auxiliares
  'ser', 'sao', 'foi', 'era', 'eram', 'ter', 'tem', 'tinha', 'ha',
  'esta', 'estao', 'estava', 'seja', 'sendo', 'fica', 'ficar',
  // pronomes e demonstrativos
  'ele', 'ela', 'eles', 'elas', 'seu', 'sua', 'seus', 'suas', 'meu',
  'minha', 'este', 'esta', 'esse', 'essa', 'aquele', 'aquela', 'isso',
  'isto', 'aquilo', 'lhe', 'nao', 'sim',
  // advérbios frequentes
  'mais', 'menos', 'muito', 'pouco', 'ja', 'ainda', 'so', 'apenas',
]);

/** Normaliza para comparação: minúsculas, sem acentos/pontuação/espaços extras. */
function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!?\u00bf\u00a1"'`\u00b4\u2019\u201c\u201d()\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Distância de Levenshtein clássica (inserção/remoção/substituição = 1). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
    }
    prev = curr;
  }
  return prev[b.length]!;
}

/** Palavras que carregam significado, já normalizadas e sem repetição. */
function keywords(normalized: string): string[] {
  return [
    ...new Set(
      normalized.split(' ').filter(w => w.length > 1 && !STOPWORDS.has(w)),
    ),
  ];
}

/**
 * A palavra esperada apareceu? Aceita 1 letra de diferença em palavras de 4+
 * caracteres, o que cobre plural ("aventura"/"aventuras") e digitação torta
 * sem casar palavras curtas que só se parecem.
 */
function present(word: string, pool: string[]): boolean {
  return pool.some(
    w =>
      w === word ||
      (word.length >= FUZZY_MIN_LEN &&
        w.length >= FUZZY_MIN_LEN &&
        levenshtein(w, word) <= 1),
  );
}

/**
 * Compara a resposta digitada com a esperada. Ver o cabeçalho do arquivo para
 * as três camadas e o que cada veredito significa.
 */
export function checkAnswer(input: string, expected: string): AnswerCheck {
  const a = normalizeAnswer(input);
  const b = normalizeAnswer(expected);

  const none = { coverage: 0, missing: [] as string[] };
  if (a.length === 0) return { verdict: 'wrong', ...none };
  if (a === b) return { verdict: 'exact', coverage: 1, missing: [] };
  if (b.length >= 5 && levenshtein(a, b) <= 1) {
    return { verdict: 'typo', coverage: 1, missing: [] };
  }

  const expectedWords = keywords(b);
  // Resposta só de palavras vazias ("é a", "no") — não há o que cobrir, e as
  // camadas 1–2 já falharam.
  if (expectedWords.length === 0) return { verdict: 'wrong', ...none };

  const given = keywords(a);
  const missing = expectedWords.filter(w => !present(w, given));
  const coverage = (expectedWords.length - missing.length) / expectedWords.length;

  const verdict: AnswerVerdict =
    coverage >= COVERAGE_CORRECT
      ? 'close'
      : coverage >= COVERAGE_FLOOR
        ? 'partial'
        : 'wrong';

  return { verdict, coverage, missing };
}
