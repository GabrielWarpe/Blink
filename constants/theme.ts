export type ThemePalette = {
  background: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceContainerLow: string;
  surfaceBright: string;
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  tertiary: string;
  tertiaryContainer: string;
  onSurface: string;
  onSurfaceVariant: string;
  outlineVariant: string;
  outline: string;
  error: string;
  success: string;
  warning: string;
  info: string;
};

/**
 * Identidade MONOCROMÁTICA — o chrome do app não tem cor própria, para que a
 * cor venha das CAPAS DOS DECKS. Substituiu a "Meia-noite" (índigo + teal).
 *
 * Duas exceções deliberadas, ambas por significado e não por decoração:
 *  - estados semânticos (`error`/`success`/`warning`/`info`) seguem coloridos:
 *    sem eles, a correção do quiz e os erros de formulário perderiam a leitura
 *    instantânea de "certo x errado";
 *  - `tertiary` é o DOURADO das patentes/conquistas do topo (Mestre, Lenda) —
 *    é a recompensa, e monocromático ela deixa de "brilhar".
 *
 * ⚠️ Espelha `global.css`: esta cópia em objeto JS alimenta o `useThemeColors`
 * (props de cor diretas — ícones, tab bar, SVG), e o CSS alimenta as classes do
 * NativeWind. Os dois precisam bater; mudou aqui, mude lá.
 */

// Escuro: preto profundo no fundo (referência X/Instagram), superfícies em
// degraus de cinza cada vez mais claros para separar card de página.
export const DARK_COLORS: ThemePalette = {
  background: '#000000',
  surface: '#000000',
  surfaceContainerLow: '#0a0a0a',
  surfaceContainer: '#121212',
  surfaceContainerHigh: '#1c1c1e',
  surfaceContainerHighest: '#2c2c2e',
  surfaceBright: '#3a3a3c',
  // Destaque = cinza-claro, NUNCA branco. Branco puro sobre preto puro é o
  // contraste máximo que existe (21:1): ele "vibra" e estoura. Estes valores
  // ficam em ~12:1 — ainda MUITO acima do exigido (AAA pede 7:1 para texto),
  // e bem mais confortável.
  //
  // `primaryContainer` é o que mais pesa: além do botão principal (largura
  // cheia), ele preenche FAB, avatar, chips ativos, switches e o heatmap —
  // área grande é onde o branco realmente estoura, não o texto.
  primary: '#c9c9c9',
  primaryContainer: '#bdbdbd',
  onPrimary: '#000000',
  onPrimaryContainer: '#000000',
  secondary: '#a1a1aa',
  secondaryContainer: '#1c1c1e',
  tertiary: '#e3b341', // dourado — só patentes/conquistas do topo
  tertiaryContainer: '#4a3a16',
  onSurface: '#c9c9c9', // texto: mesmo cinza-claro do destaque
  onSurfaceVariant: '#a1a1aa',
  outlineVariant: '#2c2c2e',
  outline: '#71717a',
  error: '#f4212e',
  success: '#22c55e',
  warning: '#e3b341',
  info: '#4a9eff',
};

// Claro: branco QUEBRADO (nunca #ffffff no fundo nem no card) — branco puro
// numa tela inteira estoura e cansa; os degraus seguem a mesma lógica do
// escuro, só invertidos (o card é mais claro que a página).
export const LIGHT_COLORS: ThemePalette = {
  background: '#e9e9e6',
  surface: '#e9e9e6',
  surfaceContainerLow: '#eeeeeb',
  surfaceContainer: '#f3f3f0',
  surfaceContainerHigh: '#e0e0dd',
  surfaceContainerHighest: '#d5d5d1',
  surfaceBright: '#f8f8f6',
  primary: '#111111',
  primaryContainer: '#111111',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#f8f8f6',
  secondary: '#52525b',
  secondaryContainer: '#e4e4e1',
  tertiary: '#a16207', // dourado escurecido para contrastar no claro
  tertiaryContainer: '#f5e6c0',
  onSurface: '#111111',
  onSurfaceVariant: '#52525b',
  outlineVariant: '#d4d4d1',
  outline: '#78787d',
  error: '#d92d20',
  success: '#15803d',
  warning: '#a16207',
  info: '#1d4ed8',
};

// Cores de deck: a UI não mostra mais cor (a capa/foto assumiu esse papel),
// mas o campo `color` segue no modelo e o import de backup precisa de um
// default válido — é o único consumidor desta lista.
export const DECK_COLORS = [
  '#2fb3a6', // teal
  '#4aa3e0', // azul
  '#7e8ce8', // índigo
  '#a98be2', // violeta
  '#5fb187', // verde
  '#e2a64e', // âmbar
  '#e37e8c', // rosa
  '#e07658', // coral
  '#8a94a6', // ardósia
  '#e6e9ee', // névoa
];
