/**
 * Medidas da barra de abas, num só lugar.
 *
 * A barra é de LARGURA CHEIA, opaca e colada no fundo da tela — o padrão do X e
 * dos apps Android, no lugar da pílula flutuante em vidro que existia aqui
 * antes (aquela era vocabulário do iOS e não lia bem fora dele).
 *
 * Ela segue `position: absolute`, então não ocupa espaço no fluxo e o conteúdo
 * passa POR BAIXO. Por isso as telas roláveis precisam reservar folga no fim —
 * ver `useTabBarInset`, que deriva tudo daqui em vez de repetir números.
 */

/**
 * Ícone + folga + linha do rótulo + `TAB_BAR_PAD_V * 2` somam a altura útil da
 * barra, hoje 52 (22 + 2 + 12 + 16) — ver `TAB_BAR_HEIGHT`. Mexer em qualquer
 * um destes quatro muda essa altura, e com ela o recuo de todas as telas.
 */
export const TAB_ICON_SIZE = 22;
export const TAB_ICON_LABEL_GAP = 2;
/** Rótulo pequeno por pedido direto — é apoio ao ícone, não protagonista. */
export const TAB_LABEL_SIZE = 9;
export const TAB_LABEL_LINE = 12;

/** Bloco do rótulo (folga + linha). Altura fixa: o rótulo está sempre visível. */
export const TAB_LABEL_BLOCK = TAB_ICON_LABEL_GAP + TAB_LABEL_LINE;

/**
 * Respiro vertical da barra, acima e abaixo do conteúdo.
 *
 * 8 põe a altura útil em 52, dentro da faixa das barras nativas (49 no iOS, 56
 * no Material). O inset seguro do aparelho entra POR FORA disto, como
 * `paddingBottom` — é o que faz a barra encostar no fundo sem o conteúdo dela
 * cair em cima do indicador de home ou dos botões de navegação do Android.
 */
export const TAB_BAR_PAD_V = 8;

/** Altura ÚTIL da barra, sem o inset seguro. Derivada, nunca chutada. */
export const TAB_BAR_HEIGHT =
  TAB_ICON_SIZE + TAB_LABEL_BLOCK + TAB_BAR_PAD_V * 2;

/** Respiro entre o fim do conteúdo rolável e o topo da barra. */
export const TAB_CONTENT_GAP = 24;

/**
 * Duração das transições da barra (troca de aba, cor, escala, entrar/sair na
 * rolagem). Uma só constante para que ícone e rótulo cheguem SEMPRE juntos —
 * tempos diferentes fazem a barra parecer desmontada durante a troca.
 */
export const TAB_TRANSITION_MS = 300;
