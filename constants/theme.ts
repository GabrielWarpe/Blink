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

// Meia-noite (escuro): índigo-tinta + petróleo-teal. Espelha global.css —
// esta cópia em objeto JS alimenta o useThemeColors (props de cor diretas:
// ícones, tab bar, SVG), então precisa bater com as variáveis CSS.
export const DARK_COLORS: ThemePalette = {
  background: '#0b0f14',
  surface: '#0b0f14',
  surfaceContainer: '#121821',
  surfaceContainerHigh: '#1a222e',
  surfaceContainerHighest: '#26303e',
  surfaceContainerLow: '#0f141b',
  surfaceBright: '#2e3947',
  primary: '#56d2c6',
  primaryContainer: '#178c87',
  onPrimary: '#04302c',
  onPrimaryContainer: '#dffbf7',
  secondary: '#aeb9c4',
  secondaryContainer: '#26303e',
  tertiary: '#e6a94d',
  tertiaryContainer: '#7a5216',
  onSurface: '#eaf1f5',
  onSurfaceVariant: '#aeb9c4',
  outlineVariant: '#313b47',
  outline: '#7e8a96',
  error: '#e5756b',
  success: '#4fb980',
  warning: '#e0a63e',
  info: '#5aa6e8',
};

// Meia-noite (claro): papel frio.
export const LIGHT_COLORS: ThemePalette = {
  background: '#f4f6f8',
  surface: '#f4f6f8',
  surfaceContainer: '#ffffff',
  surfaceContainerHigh: '#ecf0f3',
  surfaceContainerHighest: '#e2e7ec',
  surfaceContainerLow: '#f9fafc',
  surfaceBright: '#ffffff',
  primary: '#0e6e69',
  primaryContainer: '#178c87',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#dffbf7',
  secondary: '#4a525a',
  secondaryContainer: '#dae2e6',
  tertiary: '#a86a16',
  tertiaryContainer: '#f5d5a5',
  onSurface: '#181e26',
  onSurfaceVariant: '#4a545e',
  outlineVariant: '#cdd5dc',
  outline: '#76808a',
  error: '#c0392f',
  success: '#228b5c',
  warning: '#b07a20',
  info: '#2874be',
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
