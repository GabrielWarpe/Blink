import type { Deck, Flashcard } from '@/types';

/**
 * O quiz agora usa alternativas AUTORADAS por card (`quizOptions` = erradas;
 * a correta é o `back`). Um card é pergunta de quiz quando tem 2+ alternativas
 * erradas (3+ opções no total). Cards sem alternativas são só flashcards.
 */
export function cardSupportsQuiz(card: Pick<Flashcard, 'quizOptions'>): boolean {
  return (card.quizOptions?.filter(o => o.trim().length > 0).length ?? 0) >= 2;
}

/** O deck oferece quiz quando ao menos um card tem alternativas autoradas. */
export function deckSupportsQuiz(deck: Pick<Deck, 'cards'>): boolean {
  return deck.cards.some(cardSupportsQuiz);
}

/** Quantas alternativas erradas um card pode ter (total = correta + estas). */
export const MAX_QUIZ_OPTIONS = 3;

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * Monta as alternativas de um card: o verso correto + as alternativas erradas
 * escritas pelo autor (ou geradas pela IA junto com a pergunta).
 */
export function buildOptions(
  card: Pick<Flashcard, 'back' | 'quizOptions'>,
): QuizOption[] {
  const wrong = (card.quizOptions ?? [])
    .map(o => o.trim())
    .filter(o => o.length > 0)
    .slice(0, MAX_QUIZ_OPTIONS);

  return shuffle([
    { text: card.back, isCorrect: true },
    ...wrong.map(text => ({ text, isCorrect: false })),
  ]);
}
