import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useSettings } from '@/contexts/SettingsContext';

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
 * NÃO leva faixa de luz. O reflexo especular existia aqui e foi removido em
 * 20/08/2026: uma faixa de 150 px a 38% de branco varrendo por um segundo é
 * glint num painel só (é o que `GlassSpecular` faz em modal), mas numa LISTA
 * cada card recebe a sua no seu tempo — a tela inteira fica manchada de cunhas
 * cinzas em posições diferentes, que é o que se vê parado num print. Movimento
 * de superfície é para superfície única; lista quer entrada limpa.
 *
 * Respeita `reduceMotion` como o resto do app: com ela ligada, o item já nasce
 * na posição final.
 */
export function EnterAnimation({
  index = 0,
  runKey = 0,
  children,
}: EnterAnimationProps) {
  const { settings } = useSettings();
  const reduce = settings.reduceMotion;
  const progress = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) {
      progress.value = 1;
      return;
    }
    // Zera antes de animar: numa reexecução o valor já está em 1, e sem isto
    // não haveria percurso nenhum para percorrer.
    progress.value = 0;
    const delay =
      index < STAGGER_UNTIL_INDEX ? index * STAGGER_STEP_MS : 0;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: ENTER_MS, easing: Easing.out(Easing.cubic) }),
    );
    // Sem `index` nas dependências de propósito: a entrada é do MOMENTO em que
    // o item montou. Reordenar a lista (trocar o filtro) não deve reanimar o
    // que já está na tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, runKey, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [ENTER_OFFSET, 0]) },
    ],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
