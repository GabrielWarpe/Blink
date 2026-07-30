import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { withSpring, withTiming } from 'react-native-reanimated';
import { useTabBarCollapse } from '@/contexts/TabBarContext';
import { TAB_TRANSITION_MS } from '@/constants/layout';

/**
 * Rolagem acumulada, em px, para trocar de estado. Não é por evento: um único
 * frame de rolagem move pouquíssimo, e reagir a cada um faria a barra piscar em
 * micro-movimentos do dedo. O acumulador zera quando a direção inverte, então
 * "descer 200 e subir 20" já traz a barra de volta.
 */
const THRESHOLD = 18;
/** Perto do topo a barra sempre volta — lá não há tela a economizar. */
const TOP_ZONE = 24;

const SPRING = { duration: TAB_TRANSITION_MS, dampingRatio: 0.9 };

/**
 * Liga a rolagem de uma tela de aba à saída da barra (desce ao rolar para
 * baixo, volta ao rolar para cima).
 *
 * O handler é JS comum, não `useAnimatedScrollHandler`, de propósito: a decisão
 * é aritmética trivial (uma subtração e uma comparação por evento) e não ganha
 * nada rodando na thread de UI — enquanto o caminho do worklet depende de o
 * handler atravessar intacto o componente animado, o interop do NativeWind e a
 * compilação do plugin, camadas onde uma falha é silenciosa.
 *
 * A ANIMAÇÃO continua na thread de UI: escrever `withSpring` num SharedValue a
 * partir do JS dispara a mola lá, e a barra a lê via `useAnimatedStyle`. O JS só
 * decide o destino; nenhum frame é desenhado por ele.
 *
 * Vantagem prática: funciona com `ScrollView`/`FlatList` comuns, sem trocar por
 * `Animated.*` nem perder `className` nas telas.
 *
 *     const tabScroll = useTabBarScroll();
 *     <ScrollView {...tabScroll}>
 */
export function useTabBarScroll() {
  const collapsed = useTabBarCollapse();
  const lastY = useRef(0);
  const accum = useRef(0);
  // Alvo atual (0/1). Sem ele, cada evento reiniciaria a mola no mesmo destino
  // e a animação nunca assentaria.
  const target = useRef(0);

  // Ao voltar para a aba a barra reaparece: mantê-la fora numa tela que o
  // usuário acabou de abrir esconde navegação sem motivo.
  useFocusEffect(
    useCallback(() => {
      target.current = 0;
      accum.current = 0;
      lastY.current = 0;
      collapsed.value = withTiming(0, { duration: TAB_TRANSITION_MS });
    }, [collapsed]),
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const dy = y - lastY.current;
      lastY.current = y;

      let next = target.current;
      if (y <= TOP_ZONE) {
        next = 0;
        accum.current = 0;
      } else {
        // Direção inverteu → recomeça a contar deste ponto.
        if (dy * accum.current < 0) accum.current = 0;
        accum.current += dy;
        if (accum.current > THRESHOLD) {
          next = 1;
          accum.current = 0;
        } else if (accum.current < -THRESHOLD) {
          next = 0;
          accum.current = 0;
        }
      }

      if (next !== target.current) {
        target.current = next;
        collapsed.value = withSpring(next, SPRING);
      }
    },
    [collapsed],
  );

  return { onScroll, scrollEventThrottle: 16 };
}
