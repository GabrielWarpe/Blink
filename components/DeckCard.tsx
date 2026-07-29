import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGlass } from '@/hooks/useGlass';
import { CARD_RADIUS } from '@/constants/radius';
// TouchableOpacity do gesture-handler, não do react-native: este card só é
// usado dentro de SwipeableDeckRow, aninhado num GestureDetector (Gesture.Pan).
// O Touchable do RN puro roda no sistema de resposta a toque legado, que
// disputa o mesmo toque com o gesture-handler — num arrasto curto/rápido que
// não passa claramente do limiar do Pan, o legado ainda registra como toque
// válido e dispara onPress (navega para o deck) no meio do que deveria ser só
// um gesto de arrastar. Usar o Touchable do próprio gesture-handler tira essa
// disputa: os dois passam a ser arbitrados pelo mesmo sistema.
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Deck } from '@/types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { cardShadow } from '@/components/ui/Card';
import { DeckAvatar } from '@/components/DeckAvatar';

interface DeckCardProps {
  deck: Deck;
  onPress: () => void;
  /**
   * Quando presente, mostra o botão ▶ — ponto de entrada único dos modos de
   * estudo (o seletor de modo é responsabilidade do pai, via requestPlay).
   */
  onPlay?: () => void;
}

export function DeckCard({ deck, onPress, onPlay }: DeckCardProps) {
  const colors = useThemeColors();
  const glass = useGlass();
  const totalCards = deck.cards.length;

  const studiedLabel =
    deck.lastStudied != null
      ? `Estudado ${formatDistanceToNow(new Date(deck.lastStudied), {
          addSuffix: true,
          locale: ptBR,
        })}`
      : 'Nunca estudado';

  return (
    // Estilo em objeto, não `className`, nos dois TouchableOpacity deste
    // arquivo: são o do gesture-handler (ver import acima), e o layout em
    // linha (flex-row/items-center/gap) não estava sendo aplicado de volta
    // pelo interop do NativeWind — os filhos caíam em coluna. Estilo inline
    // não depende desse interop, funciona igual em qualquer componente.
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 16,
          borderRadius: CARD_RADIUS,
          backgroundColor: colors.surfaceContainer,
          // Borda fina de luz — mesmo tratamento de vidro do `ui/Card`.
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: glass.border,
        },
        cardShadow,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={glass.sheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={[StyleSheet.absoluteFill, { borderRadius: CARD_RADIUS }]}
      />
      <DeckAvatar coverUrl={deck.coverUrl} size={48} radius={12} />
      <View className="flex-1">
        <Text
          className="text-on-surface font-jakarta-semibold text-base"
          numberOfLines={1}
        >
          {deck.title}
        </Text>
        <View className="flex-row items-center gap-2 mt-0.5">
          <Text className="text-on-surface-variant font-inter-medium text-xs">
            {totalCards} {totalCards === 1 ? 'card' : 'cards'}
          </Text>
          <Text className="text-outline font-inter-regular text-xs">•</Text>
          <Text
            className="text-outline font-inter-regular text-xs flex-1"
            numberOfLines={1}
          >
            {studiedLabel}
          </Text>
        </View>
      </View>
      {onPlay != null && totalCards > 0 ? (
        <TouchableOpacity
          onPress={onPlay}
          activeOpacity={0.8}
          hitSlop={10}
          style={{
            width: 40,
            height: 40,
            borderRadius: 9999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primaryContainer,
          }}
        >
          <Ionicons name="play" size={18} color={colors.onPrimaryContainer} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.outline} />
      )}
    </TouchableOpacity>
  );
}
