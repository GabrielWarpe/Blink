/** As 4 cores da família "primary" que definem o destaque do app. */
export interface AccentColors {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
}

/**
 * Cor de destaque única do app: Teal ("Meia-noite", petróleo-teal).
 * A escolha de cor pelo usuário foi removida — o destaque é fixo.
 */
export const ACCENT: { light: AccentColors; dark: AccentColors } = {
  dark: {
    primary: '#56d2c6',
    primaryContainer: '#178c87',
    onPrimary: '#04302c',
    onPrimaryContainer: '#dffbf7',
  },
  light: {
    primary: '#0e6e69',
    primaryContainer: '#178c87',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#dffbf7',
  },
};

/** Converte "#rrggbb" em "r g b" (formato usado pelas variáveis CSS do NativeWind). */
export function hexToTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}
