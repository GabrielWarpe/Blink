import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Devolve um número que muda toda vez que a tela ganha foco — para reexecutar
 * uma animação de entrada (ver `runKey` em `components/ListItemEnter.tsx`).
 *
 * Existe porque o React Navigation NÃO desmonta as abas ao trocar: um efeito
 * de montagem roda uma única vez na vida do app, então voltar para a aba não
 * animaria nada.
 *
 * O primeiro foco é ignorado de propósito. Ele acontece junto da montagem, e
 * sem essa guarda a animação começaria e se reiniciaria no frame seguinte —
 * lê como engasgo, não como entrada.
 */
export function useReplayOnFocus(): number {
  const [runKey, setRunKey] = useState(0);
  const mounted = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      setRunKey(k => k + 1);
    }, []),
  );

  return runKey;
}
