/**
 * Raios de canto do app, para o lado JS.
 *
 * ⚠️ ESTES VALORES ESPELHAM `borderRadius` no `tailwind.config.js`. As classes
 * (`rounded-card`, `rounded-button`) cobrem quase tudo, mas alguns lugares
 * precisam do número: o recorte de um `BlurView`, o `borderRadius` de um
 * `LinearGradient` sobreposto, e componentes que estilizam por `style` em vez
 * de `className` (ex.: `DeckCard`, por causa do interop do NativeWind com o
 * Touchable do gesture-handler).
 *
 * Mudou aqui, mude lá — e vice-versa. Antes desta constante o valor 14 estava
 * copiado em quatro arquivos.
 */

/** `rounded-card` — superfícies: cards, painéis, modais. */
export const CARD_RADIUS = 18;
/** `rounded-button` — botões, campos de texto, chips retangulares. */
export const BUTTON_RADIUS = 14;
