import { useWindowDimensions } from 'react-native';

/** Margem lateral total reservada em volta da carta (24 de cada lado). */
const SIDE_MARGIN = 48;
/** Proporção retrato da carta. */
const RATIO = 1.25;
/**
 * Teto de largura. Sem ele, num tablet ou dobrável ABERTO (~840dp) a carta
 * sairia com 792 de largura e 990 de altura — mais alta que a própria tela.
 * Segura também o comprimento da linha de texto num tamanho legível.
 */
const MAX_WIDTH = 420;
/**
 * Teto de altura, como fração da tela. 0,62 é deliberado: o iPhone mais
 * apertado (SE, 375×667) usa 61%, então NENHUM iPhone atual muda de tamanho —
 * o teto só entra em telas curtas ou em tela dividida, cenários do Android.
 */
const MAX_HEIGHT_RATIO = 0.62;

/**
 * Tamanho da carta de estudo, recalculado a cada mudança de janela.
 *
 * Mede com `useWindowDimensions` em vez de `Dimensions.get('window')` no topo
 * do módulo de propósito: aquele valor é lido UMA vez e congela. No iOS quase
 * não se nota, mas no Android a janela muda de tamanho em pleno uso —
 * dobráveis, tela dividida e rotação — e a carta ficaria com a medida antiga.
 */
export function useCardSize(): {
  width: number;
  height: number;
  /** Largura da janela — para limiares de gesto, que são relativos à TELA. */
  screenWidth: number;
} {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const capped = Math.min(screenWidth - SIDE_MARGIN, MAX_WIDTH);
  const height = Math.min(capped * RATIO, screenHeight * MAX_HEIGHT_RATIO);
  // Se a altura foi limitada, a largura acompanha para a proporção não distorcer.
  return { width: Math.min(capped, height / RATIO), height, screenWidth };
}
