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
  /**
   * Realce do item ativo DENTRO de uma superfície de vidro (a pílula da aba
   * selecionada). É um realce do próprio vidro, não uma cor da paleta: com
   * `primaryContainer` ele virava a coisa mais clara da tela e gritava.
   */
  indicator: string;
  /**
   * Reflexo especular — a "luz correndo" pela superfície. Faixa diagonal
   * estreita que varre o vidro ao ele se materializar. É o traço que separa o
   * Liquid Glass do glassmorphism comum; ver `GlassSurface`.
   */
  specular: readonly [string, string, string];
}

export const GLASS_DARK: GlassTokens = {
  tint: 'rgba(18,18,18,0.55)', // surfaceContainer do tema escuro
  border: 'rgba(255,255,255,0.12)',
  sheen: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'],
  blurIntensity: 60,
  backdropIntensity: 30,
  backdropScrim: 'rgba(0,0,0,0.45)',
  blurTint: 'dark',
  indicator: 'rgba(255,255,255,0.14)',
  specular: [
    'rgba(255,255,255,0)',
    'rgba(255,255,255,0.38)',
    'rgba(255,255,255,0)',
  ],
};

export const GLASS_LIGHT: GlassTokens = {
  tint: 'rgba(248,248,246,0.60)', // surfaceContainer do tema claro
  border: 'rgba(255,255,255,0.85)',
  sheen: ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)'],
  blurIntensity: 70,
  backdropIntensity: 35,
  backdropScrim: 'rgba(0,0,0,0.25)',
  blurTint: 'light',
  indicator: 'rgba(0,0,0,0.07)',
  specular: [
    'rgba(255,255,255,0)',
    'rgba(255,255,255,0.85)',
    'rgba(255,255,255,0)',
  ],
};

/**
 * A barra flutuante usa o MESMO vidro, só que mais fino: ela cobre conteúdo o
 * tempo todo, então tint alto viraria uma tarja opaca. Antes estes valores
 * viviam duplicados dentro de `FloatingTabBar` e DIVERGIRAM do arquivo central
 * (tint 0.32 lá contra 0.55 aqui) — duas fontes de verdade para a mesma
 * receita. Agora a barra deriva daqui.
 */
export function barGlass(g: GlassTokens): GlassTokens {
  const isDark = g.blurTint === 'dark';
  return {
    ...g,
    tint: isDark ? 'rgba(18,18,18,0.32)' : 'rgba(248,248,246,0.38)',
    border: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.85)',
    sheen: isDark
      ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']
      : ['rgba(255,255,255,0.30)', 'rgba(255,255,255,0)'],
  };
}

/** Duração das transições de vidro (materializar, reagir ao toque). */
export const GLASS_TRANSITION_MS = 260;
/** Varredura do reflexo especular — mais lenta, é o "brilho passando". */
export const GLASS_SPECULAR_MS = 1000;
/** Largura da faixa de luz. Estreita demais e ela passa sem ser percebida. */
export const GLASS_SPECULAR_WIDTH = 150;

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
