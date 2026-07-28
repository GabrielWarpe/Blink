import { Platform } from 'react-native';

/**
 * Receita de "liquid glass" do app, num só lugar.
 *
 * Nasceu dentro do `FloatingTabBar` e foi extraída para cá quando o tratamento
 * passou a valer para cards, modais e overlays — duas cópias da receita
 * divergem na primeira vez que alguém ajusta uma delas.
 *
 * Estes valores NÃO saem de token de tema, e por um motivo: vidro é alfa sobre
 * o que está atrás, não uma cor da paleta.
 *
 * ⚠️ Desfoque só aparece onde há conteúdo VARIADO atrás. Sobre o fundo chapado
 * do app (`background`), borrar cor lisa devolve a mesma cor lisa — por isso
 * `GlassSurface` só liga o BlurView quando é pedido explicitamente (modais e
 * overlays, onde há a tela por trás), e os cards ficam com borda + brilho, que
 * é o que de fato se vê. Ver `components/ui/GlassSurface.tsx`.
 */
export interface GlassTokens {
  /** Fundo do painel QUANDO há BlurView atrás (overlays). Translúcido. */
  tint: string;
  /** Borda fina — a luz "pegando" a quina do vidro. */
  border: string;
  /** Brilho do topo: gradiente de branco fraco até transparente. */
  sheen: readonly [string, string];
  /** Intensidade do desfoque de um painel de vidro. */
  blurIntensity: number;
  /** Intensidade do desfoque do FUNDO atrás de um modal. */
  backdropIntensity: number;
  /** Escurecimento sobre o fundo desfocado, para o painel se destacar. */
  backdropScrim: string;
  /** Valor do prop `tint` do BlurView. */
  blurTint: 'dark' | 'light';
}

export const GLASS_DARK: GlassTokens = {
  tint: 'rgba(18,24,33,0.55)',
  border: 'rgba(255,255,255,0.12)',
  sheen: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'],
  blurIntensity: 60,
  backdropIntensity: 30,
  backdropScrim: 'rgba(0,0,0,0.45)',
  blurTint: 'dark',
};

export const GLASS_LIGHT: GlassTokens = {
  tint: 'rgba(255,255,255,0.60)',
  border: 'rgba(255,255,255,0.85)',
  sheen: ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)'],
  blurIntensity: 70,
  backdropIntensity: 35,
  backdropScrim: 'rgba(0,0,0,0.25)',
  blurTint: 'light',
};

/**
 * Sombra de um painel de vidro flutuante (modal, sheet): larga, difusa e de
 * baixa opacidade. Sombra dura mata a leitura de vidro. Para cards no fluxo,
 * continua valendo a `cardShadow` de `ui/Card`, que é mais contida.
 */
export const glassShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  android: { elevation: 10 },
  default: {},
});

/**
 * `dimezisBlurView` é o único método que produz desfoque real no Android, e a
 * própria Expo o marca como experimental. No iOS o padrão já é nativo.
 */
export const androidBlurMethod =
  Platform.OS === 'android' ? ('dimezisBlurView' as const) : undefined;
