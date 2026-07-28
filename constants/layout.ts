/**
 * Medidas da barra de abas flutuante, num só lugar.
 *
 * A barra é uma PÍLULA `position: absolute` sobre o conteúdo — não ocupa espaço
 * no fluxo. Duas consequências que estas constantes existem para resolver:
 *   1. a altura é DERIVADA do conteúdo (ícone + rótulo + folgas), nunca chutada;
 *   2. as telas roláveis precisam reservar folga no fim (ver `useTabBarInset`),
 *      senão o último card fica escondido POR BAIXO da barra.
 */

export const TAB_ICON_SIZE = 23;
export const TAB_ICON_LABEL_GAP = 3;
/**
 * 10, não 11: o rótulo mais longo ("Comunidade") mede ~63px a 11px, e a célula
 * de uma aba tem ~61px úteis numa tela de 390 — a 11px ele saía reticente.
 */
export const TAB_LABEL_SIZE = 10;
export const TAB_LABEL_LINE = 14;

/** Bloco do rótulo (folga + linha). Some inteiro quando a barra encolhe. */
export const TAB_LABEL_BLOCK = TAB_ICON_LABEL_GAP + TAB_LABEL_LINE;

/** Respiro vertical dentro da pílula do item (a que marca a aba ativa). */
export const TAB_ITEM_PAD_V = 7;
/**
 * Respiro entre a pílula do item e a borda da barra. 10, não 7: é o que dá
 * folga confortável (~7px) entre a pílula ativa e a curva do canto da barra
 * externa nas abas das pontas — ver `TAB_BAR_RADIUS`.
 */
export const TAB_BAR_PAD = 10;
/** Recuo lateral da pílula ativa dentro da sua célula. */
export const TAB_ITEM_INSET = 1;
/**
 * Raio da pílula ativa — uniforme nos 4 cantos, moderado de propósito (não
 * `altura / 2`, que vira estádio/cápsula plena e faz a curva comer a faixa do
 * rótulo, que mora colado na base do item — `labelBase: bottom: 0` em
 * TabBarIcon.tsx). A 14 a curva soma menos de 2px de invasão na linha mais
 * baixa do texto, imperceptível; a folga do rótulo mais longo ("Comunidade")
 * praticamente não muda em relação a um raio maior.
 */
export const TAB_ITEM_RADIUS = 14;
/**
 * Raio da barra externa (o "vidro"). Também moderado, pela mesma razão da
 * pílula: um raio pleno (`altura/2`) faz a barra virar uma cápsula cujos
 * cantos avançam sobre TODA a altura das abas das pontas (Início/Perfil), e a
 * pílula ativa dessas duas sai visualmente por cima do vidro. Com este valor
 * (bem abaixo de `altura/2`) sobram ~7px de folga entre a pílula ativa e a
 * curva nas duas pontas — sem precisar de nenhum ajuste especial por aba.
 */
export const TAB_BAR_RADIUS = 22;

export const TAB_ITEM_HEIGHT =
  TAB_ICON_SIZE + TAB_LABEL_BLOCK + TAB_ITEM_PAD_V * 2;
export const TAB_BAR_HEIGHT = TAB_ITEM_HEIGHT + TAB_BAR_PAD * 2;

/**
 * Estado encolhido (ao rolar para baixo): só os ícones — o bloco do rótulo sai
 * e a barra fica mais baixa, devolvendo tela ao conteúdo.
 */
export const TAB_ITEM_HEIGHT_COMPACT = TAB_ICON_SIZE + TAB_ITEM_PAD_V * 2;
export const TAB_BAR_HEIGHT_COMPACT =
  TAB_ITEM_HEIGHT_COMPACT + TAB_BAR_PAD * 2;

/** Margem lateral entre a barra e a borda da tela. */
export const TAB_BAR_SIDE_MARGIN = 16;
/** Distância entre a barra e o inset seguro de baixo (indicador de home). */
export const TAB_BAR_BOTTOM_MARGIN = 12;
/** Respiro entre o fim do conteúdo rolável e o topo da barra. */
export const TAB_CONTENT_GAP = 24;

/**
 * Duração das transições da barra (troca de aba, cor, escala, encolher). Uma só
 * constante para que indicador, ícone e rótulo cheguem SEMPRE juntos — tempos
 * diferentes fazem a barra parecer desmontada durante a troca.
 */
export const TAB_TRANSITION_MS = 300;
