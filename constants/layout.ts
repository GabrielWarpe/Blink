/**
 * Medidas da barra de abas flutuante, num só lugar.
 *
 * A barra é uma PÍLULA `position: absolute` sobre o conteúdo — não ocupa espaço
 * no fluxo. Duas consequências que estas constantes existem para resolver:
 *   1. a altura é DERIVADA do conteúdo (ícone + rótulo + folgas), nunca chutada;
 *   2. as telas roláveis precisam reservar folga no fim (ver `useTabBarInset`),
 *      senão o último card fica escondido POR BAIXO da barra.
 */

/**
 * Ícone + folga + linha do rótulo + `TAB_ITEM_PAD_V * 2` somam a altura da
 * pílula ativa, hoje fixada em 48 (22 + 2 + 12 + 12) — ver `TAB_ITEM_HEIGHT`.
 * Mexer em qualquer um destes quatro muda essa altura.
 */
export const TAB_ICON_SIZE = 22;
export const TAB_ICON_LABEL_GAP = 2;
/**
 * 9, não 10: rótulo menor por pedido direto + dá a folga horizontal que a
 * pílula mais arredondada (`TAB_ITEM_RADIUS`) gasta no rótulo mais longo
 * ("Comunidade") — as duas mudanças foram pensadas juntas.
 */
export const TAB_LABEL_SIZE = 9;
export const TAB_LABEL_LINE = 12;

/** Bloco do rótulo (folga + linha). Some inteiro quando a barra encolhe. */
export const TAB_LABEL_BLOCK = TAB_ICON_LABEL_GAP + TAB_LABEL_LINE;

/**
 * Respiro vertical dentro da pílula do item (a que marca a aba ativa).
 * Enxuto de propósito: junto com `TAB_BAR_PAD`, era daqui que vinha quase
 * metade da altura da barra em espaço morto. Em 6, a pílula fecha em 48px.
 */
export const TAB_ITEM_PAD_V = 6;
/**
 * Respiro entre a pílula do item e a borda da barra.
 *
 * Caiu de 10 para 5: com a barra em cápsula (ver `TAB_BAR_RADIUS`), a folga
 * contra a curva do canto nas abas das pontas não vem mais deste valor —
 * vem de a pílula ter raio próprio grande o bastante para a curva dela
 * "acompanhar" a curva da barra. A conta está em `TAB_BAR_RADIUS`.
 */
export const TAB_BAR_PAD = 5;
/**
 * Recuo lateral da pílula ativa dentro da sua célula. Zero: a pílula ocupa a
 * célula inteira, que é o que fecha a largura-alvo de 72px (ver
 * `TAB_BAR_SIDE_MARGIN`). Não gera encosto visual entre abas — existe uma
 * pílula só, que desliza.
 */
export const TAB_ITEM_INSET = 0;
/**
 * Raio da pílula ativa — uniforme nos 4 cantos. NÃO é `altura / 2`: a curva de
 * um raio `r` invade a faixa `[0, r]` a partir da base do item, onde mora o
 * rótulo colado (`labelBase: bottom: 0` em TabBarIcon.tsx, sempre a
 * `TAB_ITEM_PAD_V` da base).
 *
 * Folga do rótulo mais longo ("Comunidade", ~50px a 9px de fonte): a ~6px da
 * base a curva come `18 − √(18² − 12²)` ≈ 4,6px de cada lado, deixando ~58px
 * úteis numa pílula de ~68px. Sobra ~8px. Se algum dia apertar, a válvula é
 * `TAB_LABEL_SIZE`, não este valor.
 */
export const TAB_ITEM_RADIUS = 18;
/**
 * Raio da barra externa (o "vidro") — agora praticamente uma CÁPSULA, como a
 * do Instagram (altura expandida 55, metade 27,5; este valor fica logo abaixo).
 *
 * Antes isso era proibido: com a barra em cápsula, os cantos avançam sobre
 * toda a altura das abas das pontas e a pílula ativa saía por cima do vidro.
 * O que mudou é que a pílula agora tem raio próprio grande (`TAB_ITEM_RADIUS`)
 * e a barra ficou mais baixa, então as duas curvas "acompanham" uma à outra em
 * vez de se cruzarem. Verificado nos DOIS estados, medindo do centro do canto
 * da barra até o ponto mais distante do canto da pílula:
 *   - expandido: barra r=26 em (26,26); pílula r=18 em (24,23) → 3,6 + 18 =
 *     21,6 ≤ 26. Folga ~4,4px.
 *   - encolhido: a barra mede 41, então o raio CLAMPA em 20,5 (raio maior que
 *     metade do lado menor sempre clampa), e a pílula clampa em 15,5 →
 *     1 + 15,5 = 16,5 ≤ 20,5. Folga ~4px.
 * Mexer em `TAB_BAR_PAD`, `TAB_ITEM_PAD_V` ou nos raios exige refazer essa
 * conta — foi ela que reabriu o bug das pontas duas vezes.
 */
export const TAB_BAR_RADIUS = 26;

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

/**
 * Margem lateral entre a barra e a borda da tela.
 *
 * A largura da pílula é DERIVADA (largura da barra ÷ 5 abas), nunca fixa —
 * é o que faz a barra funcionar em qualquer tela.
 *
 * Sobre o "72px" da referência de design que originou estas medidas: aquele
 * layout tinha 4 ABAS, e a pílula ocupava exatamente 1/4 da barra. 72 não é um
 * absoluto, é `largura da barra ÷ 4`. Com 5 abas o equivalente é ÷ 5, o que dá
 * uma pílula naturalmente mais estreita. Tentar cravar os 72px aqui só era
 * possível apertando esta margem para 10, e aí a barra encostava nas bordas e
 * perdia a leitura de "flutuante" — que é o ponto do componente. A altura (48)
 * essa sim é absoluta e foi mantida: não depende da contagem de abas.
 */
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
