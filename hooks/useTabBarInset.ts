import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TAB_BAR_HEIGHT,
  TAB_BAR_BOTTOM_MARGIN,
  TAB_CONTENT_GAP,
} from '@/constants/layout';

/**
 * Espaço que a barra de abas flutuante ocupa sobre a tela.
 *
 * A barra é `position: absolute`, então o conteúdo passa POR BAIXO dela — sem
 * reservar essa folga o último item fica escondido. Inclui o inset seguro
 * porque as telas usam `SafeAreaView edges={['top','left','right']}` e portanto
 * se estendem até a borda de baixo do aparelho.
 *
 * - `contentInset`: folga no fim de uma lista/rolagem (`paddingBottom`).
 * - `barTop`: distância do fundo da tela até o TOPO da barra — âncora para
 *   elementos flutuantes próprios da tela (ex.: o FAB de Decks), que precisam
 *   pousar ACIMA da barra em vez de atrás dela.
 */
export function useTabBarInset(): { contentInset: number; barTop: number } {
  const { bottom } = useSafeAreaInsets();
  const barTop = bottom + TAB_BAR_BOTTOM_MARGIN + TAB_BAR_HEIGHT;
  return { barTop, contentInset: barTop + TAB_CONTENT_GAP };
}
