import { Platform } from 'react-native';

/**
 * Medidas da barra de abas, num só lugar. A altura é DERIVADA do conteúdo
 * (ícone + rótulo) em vez de chutada — assim a barra encosta nos ícones, sem
 * vão sobrando — e as telas usam a mesma constante para reservar espaço no fim
 * da rolagem, senão o último card fica escondido atrás dela.
 */

export const TAB_ICON_SIZE = 23;
export const TAB_ICON_LABEL_GAP = 3;
export const TAB_LABEL_LINE = 14;

const CONTENT_HEIGHT = TAB_ICON_SIZE + TAB_ICON_LABEL_GAP + TAB_LABEL_LINE;

/** Respiro entre a divisória e os ícones. */
export const TAB_BAR_TOP_PAD = 14;
/**
 * Folga inferior. No iOS o indicador de home passa por cima do fundo da
 * barra, como é o padrão do sistema — por isso não precisa do inset cheio.
 */
export const TAB_BAR_BOTTOM_PAD = Platform.OS === 'ios' ? 12 : 8;

export const TAB_BAR_HEIGHT =
  TAB_BAR_TOP_PAD + CONTENT_HEIGHT + TAB_BAR_BOTTOM_PAD;

/**
 * Respiro no fim de uma tela rolável das abas. É só folga estética: o tab bar
 * não é `position: absolute`, então o conteúdo nunca fica embaixo dele.
 */
export const TAB_SCREEN_BOTTOM_INSET = 32;
