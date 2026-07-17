import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import type { Deck } from '@/types';
import { DeckAvatar } from '@/components/DeckAvatar';

export const DECK_MINI_CARD_WIDTH = 140;

interface DeckMiniCardProps {
  deck: Deck;
  /** Cards vencidos deste deck agora — 0 mostra a contagem total no lugar. */
  dueCount: number;
  onPress: () => void;
}

/**
 * Card compacto (capa grande + título + contagem) para o carrossel horizontal
 * "Continuar estudando" da Home — foco em decisão rápida, sem os detalhes da
 * linha completa do `DeckCard`.
 */
export function DeckMiniCard({ deck, dueCount, onPress }: DeckMiniCardProps) {
  const totalCards = deck.cards.length;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ width: DECK_MINI_CARD_WIDTH }}
    >
      <DeckAvatar
        coverUrl={deck.coverUrl}
        size={DECK_MINI_CARD_WIDTH}
        radius={16}
      />
      <Text
        className="text-on-surface font-jakarta-bold text-sm mt-2 leading-5"
        numberOfLines={2}
      >
        {deck.title}
      </Text>
      <Text className="text-outline font-inter-medium text-xs mt-0.5">
        {dueCount > 0
          ? `${dueCount} devidos`
          : `${totalCards} ${totalCards === 1 ? 'card' : 'cards'}`}
      </Text>
    </TouchableOpacity>
  );
}
