import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useSettings } from '@/contexts/SettingsContext';
import { useGlass } from '@/hooks/useGlass';
import { GLASS_SPECULAR_MS, GLASS_SPECULAR_WIDTH } from '@/constants/glass';

/** Duração da entrada de um item. */
const ENTER_MS = 320;
/** Distância que o item sobe ao entrar. Curta: é acento, não voo. */
const ENTER_OFFSET = 18;
/** Intervalo entre um item e o seguinte na cascata. */
const STAGGER_STEP_MS = 45;
/**
 * Até que índice a cascata se aplica.
 *
 * Só a PRIMEIRA leva (o que já cabe na tela) entra escalonado. Um item que
 * monta depois, durante a rolagem, entra imediatamente — se o atraso fosse
 * `índice × passo`, o 30º card esperaria mais de um segundo para aparecer, e o
 * usuário veria um buraco na lista em vez de uma animação.
 */
const STAGGER_UNTIL_INDEX = 8;

interface EnterAnimationProps {
  /**
   * Posição na lista — define o atraso na cascata inicial. Em elemento
   * solto (não é lista), deixe 0.
   */
  index?: number;
  /**
   * Raio dos cantos do item. Quando passado, uma faixa de luz varre o item ao
   * ele entrar (o mesmo reflexo especular dos painéis de vidro), recortada
   * nesse raio. Sem ele, só a entrada.
   *
   * É gradiente em movimento, NÃO BlurView: não custa view nativa por item,
   * então pode rodar numa lista longa sem comer frames de rolagem.
   */
  shimmerRadius?: number;
  /**
   * Muda de valor para REEXECUTAR a animação. As abas ficam montadas quando o
   * usuário troca de aba (o React Navigation não desmonta), então só o efeito
   * de montagem nunca rodaria de novo — a tela incrementa isto ao ganhar foco.
   */
  runKey?: number;
  children: React.ReactNode;
}

/**
 * Entrada de uma superfície: sobe um pouco + fade — em cascata quando são
 * vários (lista), sozinha quando é um card só (ex.: o estado vazio da Home).
 *
 * Anima quando o item aparece, não a cada rolagem. Como a `FlatList` monta os
 * itens em lotes conforme se rola, o efeito acontece progressivamente ao descer
 * a lista — sem re-animar quem já está montado, o que ficaria barulhento indo e
 * voltando na mesma região.
 *
 * Roda de novo a cada vez que a aba ganha foco, via `runKey`.
 *
 * Respeita `reduceMotion` como o resto do app: com ela ligada, o item já nasce
 * na posição final.
 */
export function EnterAnimation({
  index = 0,
  shimmerRadius,
  runKey = 0,
  children,
}: EnterAnimationProps) {
  const { settings } = useSettings();
  const glass = useGlass();
  const { width: screenW } = useWindowDimensions();
  const reduce = settings.reduceMotion;
  const progress = useSharedValue(reduce ? 1 : 0);
  const sweep = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) {
      progress.value = 1;
      sweep.value = 1;
      return;
    }
    // Zera antes de animar: numa reexecução os valores já estão em 1, e sem
    // isto não haveria percurso nenhum para percorrer.
    progress.value = 0;
    sweep.value = 0;
    const delay =
      index < STAGGER_UNTIL_INDEX ? index * STAGGER_STEP_MS : 0;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: ENTER_MS, easing: Easing.out(Easing.cubic) }),
    );
    // A luz começa DEPOIS do item ter chegado: varrer um item que ainda está
    // deslizando embaralha os dois movimentos.
    sweep.value = withDelay(
      delay + ENTER_MS * 0.5,
      withTiming(1, {
        duration: GLASS_SPECULAR_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
    // Sem `index` nas dependências de propósito: a entrada é do MOMENTO em que
    // o item montou. Reordenar a lista (trocar o filtro) não deve reanimar o
    // que já está na tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, runKey, progress, sweep]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [ENTER_OFFSET, 0]) },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sweep.value, [0, 0.12, 0.8, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateX: interpolate(
          sweep.value,
          [0, 1],
          [-GLASS_SPECULAR_WIDTH, screenW],
        ),
      },
      { rotate: '18deg' },
    ],
  }));

  return (
    <Animated.View style={style}>
      {children}
      {shimmerRadius != null && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: shimmerRadius, overflow: 'hidden' },
          ]}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                // Sobra em cima/embaixo para a faixa INCLINADA cobrir o item
                // inteiro — sem isso as pontas deixariam cantos sem luz.
                top: -60,
                bottom: -60,
                width: GLASS_SPECULAR_WIDTH,
              },
              shimmerStyle,
            ]}
          >
            <LinearGradient
              colors={glass.specular}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}
