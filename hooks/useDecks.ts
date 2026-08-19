import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Deck } from '@/types';
import type { SourceType } from '@/types/db';
import { db } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

export interface NewDeckInput {
  title: string;
  description?: string;
  emoji: string;
  color: string;
  coverUrl?: string | null;
  sourceType: SourceType;
  tags?: string[];
  // `images` são URLs já hospedadas no `card-images` (upload manual ou escolha
  // da IA). O tipo omitia o campo e só não quebrava porque o payload chega por
  // variável, sem checagem de excesso de propriedades.
  cards: {
    front: string;
    back: string;
    images?: string[];
    quizOptions?: string[];
  }[];
}

export function useDecks() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  /**
   * Falha da última carga, ou `null`.
   *
   * Existe porque, sem ela, uma consulta que EXPLODE e uma conta que de fato
   * não tem deck produzem a mesma tela: lista vazia. Quem olha não distingue
   * "sem decks" de "sem internet" ou "RLS barrou" — e a exceção nem aparecia,
   * porque o `useFocusEffect` chama `void load()` e a rejeição se perde.
   */
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setDecks([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await db.decks.getAll(user.id);
      setDecks(data);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      if (__DEV__) console.warn(`[Blink/decks] não carregou: ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Recarrega sempre que a tela ganha foco (ex.: ao voltar da criação/exclusão
  // de um deck), garantindo que a lista esteja sempre atualizada.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const createDeck = useCallback(
    async (input: NewDeckInput): Promise<Deck | null> => {
      if (!user) return null;
      const deck = await db.decks.create(
        user.id,
        {
          title: input.title,
          description: input.description,
          emoji: input.emoji,
          color: input.color,
          coverUrl: input.coverUrl,
          sourceType: input.sourceType,
          tags: input.tags,
        },
        input.cards,
      );
      await load();
      return deck;
    },
    [user, load],
  );

  const deleteDeck = useCallback(
    async (id: string) => {
      await db.decks.delete(id);
      await load();
    },
    [load],
  );

  return { decks, loading, error, createDeck, deleteDeck, reload: load };
}
