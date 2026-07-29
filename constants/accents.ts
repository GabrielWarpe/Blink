/** As 4 cores da família "primary" que definem o destaque do app. */
export interface AccentColors {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
}

/**
 * Destaque MONOCROMÁTICO: branco no escuro, quase-preto no claro. O app não
 * tem mais cor de marca no chrome — a cor vem das capas dos decks. Espelha a
 * família `primary*` de `constants/theme.ts`; os dois precisam bater.
 *
 * (A escolha de cor pelo usuário foi removida antes disto — o destaque é fixo.)
 */
export const ACCENT: { light: AccentColors; dark: AccentColors } = {
  dark: {
    primary: '#c9c9c9',
    primaryContainer: '#bdbdbd',
    onPrimary: '#000000',
    onPrimaryContainer: '#000000',
  },
  light: {
    primary: '#111111',
    primaryContainer: '#111111',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#f3f3f0',
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
