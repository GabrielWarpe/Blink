import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/Button';
import { cardShadow } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemePalette } from '@/constants/theme';

interface Slide {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Cor de destaque do slide (chave da paleta do tema). */
  accent: keyof Pick<ThemePalette, 'primary' | 'tertiary' | 'info' | 'success'>;
  title: string;
  body: string;
  /** Mini-demonstração visual da feature, exibida dentro do card. */
  demo: (colors: ThemePalette) => React.ReactNode;
}

// ── Mini-demos: cada slide mostra a feature "em miniatura" ───────────────────

/** Slide 1: um deck como aparece na lista (capa/ícone + título + tags). */
function DeckDemo(colors: ThemePalette) {
  return (
    <View className="w-full bg-surface-container-high rounded-2xl p-4 flex-row items-center gap-3">
      {/* Pilha de camadas em chip tingido — mesmo padrão do DeckAvatar (fallback
          sem capa). Consistente com o resto do app, sem emoji de chrome. */}
      <View
        className="w-12 h-12 rounded-xl items-center justify-center"
        style={{ backgroundColor: colors.primary + '1f' }}
      >
        <Ionicons name="layers" size={24} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-on-surface font-jakarta-bold text-sm">
          Biologia — Célula
        </Text>
        <Text className="text-outline font-inter-regular text-xs mt-0.5">
          24 cards · gerado com IA
        </Text>
      </View>
      <Ionicons name="sparkles" size={18} color={colors.primary} />
    </View>
  );
}

/** Slide 2: a resposta binária do estudo — errei ou acertei. */
function GradesDemo(colors: ThemePalette) {
  return (
    <View className="w-full flex-row justify-center gap-3">
      <View
        className="flex-row items-center gap-2 rounded-3xl px-5 py-2.5"
        style={{ backgroundColor: colors.error + '14' }}
      >
        <Ionicons name="close" size={20} color={colors.error} />
        <Text
          className="font-jakarta-bold text-base"
          style={{ color: colors.error }}
        >
          Errei
        </Text>
      </View>
      <View
        className="flex-row items-center gap-2 rounded-3xl px-5 py-2.5"
        style={{ backgroundColor: colors.success + '14' }}
      >
        <Text
          className="font-jakarta-bold text-base"
          style={{ color: colors.success }}
        >
          Entendi
        </Text>
        <Ionicons name="checkmark" size={20} color={colors.success} />
      </View>
    </View>
  );
}

/** Slide 3: alternativas de quiz, com a correta marcada. */
function QuizDemo(colors: ThemePalette) {
  return (
    <View className="w-full gap-2">
      <View className="bg-surface-container-high rounded-xl px-4 py-3 flex-row items-center border border-outline-variant/30">
        <Text className="flex-1 text-on-surface-variant font-inter-regular text-sm">
          Mitocôndria
        </Text>
      </View>
      <View
        className="rounded-xl px-4 py-3 flex-row items-center border"
        style={{
          borderColor: colors.primary,
          backgroundColor: colors.primary + '14',
        }}
      >
        <Text className="flex-1 text-on-surface font-inter-semibold text-sm">
          Ribossomo
        </Text>
        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
      </View>
    </View>
  );
}

/** Slide 4: sequência + meta diária em progresso. */
function StreakDemo(colors: ThemePalette) {
  return (
    <View className="w-full bg-surface-container-high rounded-2xl p-4 gap-3">
      <View className="flex-row items-center gap-2">
        <Ionicons name="flame" size={20} color={colors.tertiary} />
        <Text className="text-on-surface font-jakarta-bold text-sm">
          7 dias seguidos
        </Text>
        <View className="flex-1" />
        <Ionicons name="trophy" size={18} color={colors.tertiary} />
        <Text className="text-outline font-inter-medium text-xs">12/20</Text>
      </View>
      <View className="h-2 bg-surface-container-highest rounded-pill overflow-hidden">
        <View
          className="h-full rounded-pill"
          style={{ width: '70%', backgroundColor: colors.primary }}
        />
      </View>
      <Text className="text-outline font-inter-regular text-xs">
        Meta diária: 14 de 20 cards
      </Text>
    </View>
  );
}

// Tour das features reais do app, na ordem em que o usuário as encontra.
const SLIDES: Slide[] = [
  {
    icon: 'sparkles',
    accent: 'primary',
    title: 'Aprenda qualquer assunto',
    body: 'Digite um tópico e a IA monta o deck em segundos — ou crie os cards você mesmo e anexe imagens.',
    demo: DeckDemo,
  },
  {
    icon: 'layers',
    accent: 'primary',
    title: 'Estude no ritmo certo',
    body: 'Diga só se acertou ou errou. Os que você errar voltam na mesma sessão, e a repetição espaçada agenda cada card para a hora exata de revisar.',
    demo: GradesDemo,
  },
  {
    icon: 'extension-puzzle',
    accent: 'info',
    title: 'Pratique de outros jeitos',
    body: 'Além dos flashcards, teste-se com o Quiz de alternativas ou digite a resposta no modo Escrever.',
    demo: QuizDemo,
  },
  {
    icon: 'flame',
    accent: 'tertiary',
    title: 'Crie o hábito',
    body: 'Defina sua meta diária, mantenha a sequência viva e desbloqueie conquistas enquanto acompanha seu progresso.',
    demo: StreakDemo,
  },
];

/** Uma face do card do tutorial (mesma superfície/sombra dos cards do app). */
function SlideFace({ slide }: { slide: Slide }) {
  const colors = useThemeColors();
  const tint = colors[slide.accent];
  return (
    <View className="flex-1 items-center justify-center px-7 py-8">
      <View
        className="w-16 h-16 rounded-card items-center justify-center mb-5"
        style={{ backgroundColor: tint + '1f' }}
      >
        <Ionicons name={slide.icon} size={30} color={tint} />
      </View>
      <Text
        className="text-on-surface font-jakarta-extrabold text-2xl text-center"
        style={{ letterSpacing: -0.5 }}
      >
        {slide.title}
      </Text>
      <Text className="text-on-surface-variant font-inter-regular text-sm text-center mt-3 leading-5">
        {slide.body}
      </Text>
      <View className="mt-6 w-full items-center">{slide.demo(colors)}</View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { complete } = useOnboarding();
  const { settings } = useSettings();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();

  const CARD_WIDTH = width - 48;
  const CARD_HEIGHT = CARD_WIDTH * 1.35;

  // `index` = passo visível; durante a virada, `pending` é o passo de destino.
  // A rotação é CONTÍNUA (0 → 1 → 2… meia-volta por passo) e nunca é resetada:
  // resetar exigia trocar o conteúdo da frente no mesmo instante, e qualquer
  // atraso do React fazia o card antigo piscar. Aqui as duas faces alternam
  // (passos pares numa, ímpares na outra) e só a face ESCONDIDA muda de
  // conteúdo — a visível nunca é tocada, então não há flash.
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  const progress = useSharedValue(0);

  const shown = pending ?? index;
  const isLast = shown === SLIDES.length - 1;

  const lastIdx = SLIDES.length - 1;
  // Slide pré-impresso na face ESCONDIDA. Precisa ser estado, não derivado de
  // `index + 1`: com o botão de voltar o destino pode ser `index - 1`, e se o
  // verso continuasse carregando o próximo, o card viraria mostrando o slide
  // errado. Quem dispara o movimento define isto ANTES de animar.
  const [hiddenIdx, setHiddenIdx] = useState(Math.min(1, lastIdx));
  // Face A mostra os passos pares; face B, os ímpares. A que não está com o
  // passo atual carrega o destino (fica pré-impressa no "verso") — e o destino
  // tem sempre a paridade oposta, indo para frente ou para trás.
  const slideA = index % 2 === 0 ? SLIDES[index] : SLIDES[hiddenIdx];
  const slideB = index % 2 === 1 ? SLIDES[index] : SLIDES[hiddenIdx];

  const finish = () => {
    complete();
    router.replace('/(tabs)');
  };

  // Mesma virada 3D do FlashCard do modo estudo.
  const faceAStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${progress.value * 180}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));
  const faceBStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${180 + progress.value * 180}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  // Ao terminar a virada, o estado assume o novo passo. A face visível já
  // mostra esse conteúdo (nada muda nela); só o verso escondido recarrega.
  const commitFlip = (target: number) => {
    setIndex(target);
    setPending(null);
    // Volta a pré-imprimir o PRÓXIMO no verso: é o movimento mais provável.
    setHiddenIdx(Math.min(target + 1, lastIdx));
  };

  /** Vira o card até `target` (para frente ou para trás — a rotação é a mesma). */
  const flipTo = (target: number) => {
    if (pending !== null) return; // ignora toques durante a virada
    setHiddenIdx(target); // o verso precisa mostrar o DESTINO, não o próximo
    if (settings.reduceMotion) {
      progress.value = target;
      setIndex(target);
      setHiddenIdx(Math.min(target + 1, lastIdx));
      return;
    }
    setPending(target);
    progress.value = withTiming(
      target,
      { duration: 550, easing: Easing.out(Easing.cubic) },
      finished => {
        if (finished) runOnJS(commitFlip)(target);
      },
    );
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    flipTo(index + 1);
  };

  const back = () => {
    if (shown === 0) return;
    flipTo(index - 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Voltar e Pular: ambos SEMPRE presentes, só invisíveis quando não se
          aplicam (voltar no 1º slide, pular no último) — some-los de verdade
          faria o cabeçalho mudar de altura e o card saltar entre os passos. */}
      {/* A opacidade vive nos Views de FORA, nunca no TouchableOpacity.
          O Touchable descarta qualquer `opacity` que venha no style: ele
          renderiza `[props.style, { opacity: <Animated.Value própria> }]`
          (TouchableOpacity.js:325) e só reconcilia esse valor num efeito de
          update, com driver nativo. São três peças móveis para o que deveria
          ser um número fixo — e no Android isso falhava de fato: a seta não
          aparecia no 2º passo e vinha apagada nos seguintes. Aqui o valor é
          estático numa View comum, então não há nada para dessincronizar. */}
      <View className="flex-row items-center justify-between px-5 pt-3">
        <View
          style={{ opacity: shown === 0 ? 0 : 1 }}
          pointerEvents={shown === 0 ? 'none' : 'auto'}
        >
          <TouchableOpacity
            onPress={back}
            activeOpacity={0.7}
            disabled={shown === 0}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Voltar ao passo anterior"
            className="px-3 py-2"
          >
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        <View
          style={{ opacity: isLast ? 0 : 1 }}
          pointerEvents={isLast ? 'none' : 'auto'}
        >
          <TouchableOpacity
            onPress={finish}
            activeOpacity={0.7}
            disabled={isLast}
            hitSlop={12}
            className="px-3 py-2"
          >
            <Text className="text-outline font-inter-medium text-sm">Pular</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card com virada 3D entre os passos */}
      <View className="flex-1 items-center justify-center">
        <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
          {/* Face A: passos pares (0, 2, …) */}
          <Animated.View
            style={[
              faceAStyle,
              cardShadow,
              { position: 'absolute', width: '100%', height: '100%' },
            ]}
            className="bg-surface-container rounded-card border border-outline-variant/20"
          >
            <SlideFace slide={slideA} />
          </Animated.View>

          {/* Face B: passos ímpares (1, 3, …) — pré-girada meia-volta à frente */}
          <Animated.View
            style={[
              faceBStyle,
              cardShadow,
              { position: 'absolute', width: '100%', height: '100%' },
            ]}
            className="bg-surface-container rounded-card border border-outline-variant/20"
          >
            <SlideFace slide={slideB} />
          </Animated.View>
        </View>
      </View>

      {/* Dots */}
      <View className="flex-row justify-center gap-2 mb-6">
        {SLIDES.map((_, i) => (
          <View
            key={i}
            className="h-2 rounded-pill"
            style={{
              width: i === shown ? 22 : 8,
              backgroundColor:
                i === shown ? colors.primary : colors.surfaceContainerHighest,
            }}
          />
        ))}
      </View>

      {/* CTA */}
      <View className="px-6 pb-4 pt-2">
        <Button variant="primary" size="lg" className="w-full" onPress={next}>
          {isLast ? 'Começar a estudar' : 'Próximo'}
        </Button>
      </View>
    </SafeAreaView>
  );
}
