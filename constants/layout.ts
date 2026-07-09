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

/** Respiro acima dos ícones — só o suficiente para não colar no conteúdo. */
export const TAB_BAR_TOP_PAD = 4;
/** No iOS reserva espaço para o indicador de home; no Android, um respiro. */
export const TAB_BAR_BOTTOM_PAD = Platform.OS === 'ios' ? 16 : 8;

export const TAB_BAR_HEIGHT =
  TAB_BAR_TOP_PAD + CONTENT_HEIGHT + TAB_BAR_BOTTOM_PAD;

/** Espaço a reservar no fim de uma tela rolável dentro das abas. */
export const TAB_SCREEN_BOTTOM_INSET = TAB_BAR_HEIGHT + 24;
