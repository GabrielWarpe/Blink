import { useColorScheme } from 'nativewind';
import {
  GLASS_DARK,
  GLASS_LIGHT,
  compensateWeakBlur,
  type GlassTokens,
} from '@/constants/glass';

/**
 * Tokens de vidro do tema ativo.
 *
 * Mesma regra do `useThemeColors`: só `'light'` é claro — indefinido cai no
 * escuro. Com `=== 'dark'` o vidro sairia claro sobre a paleta escura.
 *
 * Passa por `compensateWeakBlur` como ÚLTIMO passo: onde o aparelho não
 * consegue desfocar de verdade, o painel vira superfície quase opaca em vez de
 * vidro falhado. Como o ajuste mora aqui, toda superfície de vidro do app o
 * herda — não há um lugar para esquecer.
 */
export function useGlass(): GlassTokens {
  const { colorScheme } = useColorScheme();
  return compensateWeakBlur(colorScheme === 'light' ? GLASS_LIGHT : GLASS_DARK);
}
