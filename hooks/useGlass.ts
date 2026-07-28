import { useColorScheme } from 'nativewind';
import { GLASS_DARK, GLASS_LIGHT, type GlassTokens } from '@/constants/glass';

/**
 * Tokens de vidro do tema ativo.
 *
 * Mesma regra do `useThemeColors`: só `'light'` é claro — indefinido cai no
 * escuro. Com `=== 'dark'` o vidro sairia claro sobre a paleta escura.
 */
export function useGlass(): GlassTokens {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'light' ? GLASS_LIGHT : GLASS_DARK;
}
