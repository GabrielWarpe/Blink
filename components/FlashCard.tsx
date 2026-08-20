import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import type { Flashcard } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useCardSize } from '@/hooks/useCardSize';

// Teto da faixa de texto quando o card tem imagem. A faixa cresce com a
// pergunta, mas metade do card é o limite: passar disso espreme a figura, que
// é justamente o que a pergunta manda olhar.
const FRONT_TEXT_MAX_RATIO = 0.5;

interface FlashCardProps {
  card: Flashcard;
  /** Controlado externamente: false = pergunta, true = resposta. */
  flipped: boolean;
  /** Toque no card também alterna (opcional). */
  onPress?: () => void;
}

export function FlashCard({ card, flipped, onPress }: FlashCardProps) {
  const { settings } = useSettings();
  const { width: CARD_WIDTH, height: CARD_HEIGHT } = useCardSize();
  const progress = useSharedValue(0);
  const hasImage = card.images.length > 0;

  // Anima a virada sempre que o estado controlado muda.
  useEffect(() => {
    progress.value = withTiming(flipped ? 1 : 0, {
      duration: settings.reduceMotion ? 0 : 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [flipped, progress, settings.reduceMotion]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.97 : 1}
      disabled={!onPress}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      {/* Front face */}
      <Animated.View
        style={[
          frontStyle,
          { position: 'absolute', width: '100%', height: '100%' },
        ]}
        className="rounded-card overflow-hidden border border-outline-variant/30"
      >
        {hasImage ? (
          // Figura em cima, pergunta embaixo — sem sobreposição.
          //
          // Antes a imagem preenchia o card com `cover` e o texto flutuava por
          // cima: num esquema com os painéis A, B e C, o C era cortado e o
          // rodapé sumia atrás da faixa preta. A pergunta citava o que não dava
          // para ver. Aqui a figura tem faixa própria e aparece inteira.
          <View className="flex-1 bg-surface-container">
            <View className="flex-1 bg-surface-container-highest">
              <Image
                source={{ uri: card.images[0] }}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={0}
                style={{ flex: 1 }}
              />
              <View className="absolute top-4 right-4 bg-primary/10 rounded-full px-3 py-1">
                <Text className="text-primary font-inter-medium text-xs">
                  Questão
                </Text>
              </View>
              {card.images.length > 1 && (
                <View className="absolute top-4 left-4 bg-primary/10 rounded-full px-2.5 py-1">
                  <Text className="text-primary font-inter-medium text-xs">
                    1/{card.images.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Cresce com a pergunta, mas nunca passa de metade do card: numa
                pergunta longa a figura ainda precisa ter espaço. */}
            <View
              className="px-6 py-5 justify-center"
              style={{ maxHeight: CARD_HEIGHT * FRONT_TEXT_MAX_RATIO }}
            >
              <Text className="text-on-surface font-jakarta-bold text-lg leading-7 text-center">
                {card.front}
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-1 bg-surface-container items-center justify-center p-8">
            <View className="absolute top-4 right-4 bg-primary/10 rounded-full px-3 py-1">
              <Text className="text-primary font-inter-medium text-xs">
                Questão
              </Text>
            </View>
            <Text className="text-on-surface font-jakarta-bold text-2xl leading-9 text-center">
              {card.front}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Back face */}
      <Animated.View
        style={[
          backStyle,
          { position: 'absolute', width: '100%', height: '100%' },
        ]}
        className="bg-surface-container-high rounded-card border border-primary/30 items-center justify-center p-8"
      >
        <View className="absolute top-4 right-4 bg-primary/20 rounded-full px-3 py-1">
          <Text className="text-primary font-inter-medium text-xs">Resposta</Text>
        </View>
        <Text className="text-on-surface font-jakarta-semibold text-xl text-center leading-8">
          {card.back}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}
