import type { Flashcard, Deck, Grade } from '@/types';

// A geração por IA vive na Edge Function `generate-cards` (backend) — o
// cliente fica em lib/api/generateCards.ts. Aqui restam apenas o SM-2 e os
// utilitários de sessão/estatística dos cards.

export function makeFlashcard(
  front: string,
  back: string,
  images: string[] = [],
  quizOptions: string[] = [],
): Flashcard {
  const now = new Date().toISOString();
  return {
    id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    front,
    back,
    createdAt: now,
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
    nextReview: now,
    mastered: false,
    images,
    quizOptions,
  };
}

/**
 * SM-2 com avaliação de 4 níveis (De novo / Difícil / Bom / Fácil).
 * Mantém exatamente os mesmos campos persistidos de antes — só a fórmula muda.
 * O armazenamento do intervalo é em dias; "De novo" reagenda para o dia seguinte
 * (a re-exibição imediata é tratada pela fila da sessão, não pelo agendamento).
 */

/** Teto do intervalo, em dias (100 anos — o mesmo do Anki). Ver `reviewCard`. */
const MAX_INTERVAL_DAYS = 36500;

/** Protege contra intervalos corrompidos já gravados (NaN, negativo, absurdo). */
export function sanitizeInterval(days: number): number {
  if (!Number.isFinite(days) || days < 1) return 1;
  return Math.min(Math.round(days), MAX_INTERVAL_DAYS);
}
export function reviewCard(card: Flashcard, grade: Grade): Flashcard {
  const now = new Date();
  let { interval, repetitions, easeFactor } = card;

  if (grade === 'again') {
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = grade === 'easy' ? 4 : 1;
    } else if (repetitions === 2) {
      interval = grade === 'hard' ? 3 : 6;
    } else {
      const factor =
        grade === 'hard' ? 1.2 : grade === 'easy' ? easeFactor * 1.3 : easeFactor;
      interval = Math.max(1, Math.round(interval * factor));
    }
    const delta = grade === 'hard' ? -0.15 : grade === 'easy' ? 0.15 : 0;
    easeFactor = Math.max(1.3, easeFactor + delta);
  }

  // Teto obrigatório: o intervalo é MULTIPLICADO a cada acerto, então sem um
  // limite ele explode (acertar o mesmo card ~15 vezes seguidas já passa de um
  // milhão de dias, e o `next_review_date` vira uma data no ano 19296 — o
  // Postgres rejeita com 22009). O Anki usa o mesmo teto de 100 anos.
  interval = Math.min(interval, MAX_INTERVAL_DAYS);

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...card,
    interval,
    repetitions,
    easeFactor,
    nextReview: nextReview.toISOString(),
    lastReviewed: now.toISOString(),
  };
}

/** Cards já vistos cujo próximo review já venceu (devidos de verdade). */
export function getDueCards(deck: Pick<Deck, 'cards'>): Flashcard[] {
  const now = new Date();
  return deck.cards.filter(
    c => c.repetitions > 0 && new Date(c.nextReview) <= now,
  );
}

/** Cards nunca estudados. */
export function getNewCards(deck: Pick<Deck, 'cards'>): Flashcard[] {
  return deck.cards.filter(c => c.repetitions === 0);
}

/**
 * Monta a lista de uma sessão de repetição espaçada: todos os cards devidos +
 * todos os cards novos (nunca estudados).
 */
export function getSessionCards(deck: Pick<Deck, 'cards'>): Flashcard[] {
  return [...getDueCards(deck), ...getNewCards(deck)];
}

export type Maturity = 'new' | 'learning' | 'young' | 'mature';

/** Estágio de maturidade de um card, ao estilo Anki (corte em 21 dias). */
export function cardMaturity(c: Pick<Flashcard, 'repetitions' | 'interval'>): Maturity {
  if (c.repetitions === 0) return 'new';
  if (c.interval < 7) return 'learning';
  if (c.interval < 21) return 'young';
  return 'mature';
}

