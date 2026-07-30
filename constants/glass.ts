import { Platform } from 'react-native';

/**
 * Receita de "liquid glass" do app, num só lugar.
 *
 * Nasceu na barra de abas e foi extraída para cá quando o tratamento passou a
 * valer para cards, modais e overlays — duas cópias da receita divergem na
 * primeira vez que alguém ajusta uma delas. A barra deixou de usar vidro (ver
 * `components/TabBar.tsx`); estes tokens seguem servindo os modais e sheets.
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
  specular: [
    'rgba(255,255,255,0)',
    'rgba(255,255,255,0.85)',
    'rgba(255,255,255,0)',
  ],
};

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

/**
 * Android 12 (API 31). Abaixo daqui o expo-blur desfoca por `RenderScriptBlur`;
 * a partir daqui, por `RenderEffectBlur`, acelerado por hardware
 * (`ExpoBlurView.kt: configureBlurView`). São renderizadores diferentes, com
 * custo e resultado diferentes — e é a fronteira que explica o mesmo app sair
 * com vidro num Android e sem vidro em outro.
 */
const ANDROID_RENDER_EFFECT_API = 31;

/**
 * Divisor do raio de desfoque no Android — o knob `blurReductionFactor`.
 *
 * O padrão do expo-blur é **4** (`ExpoBlurView.kt`: `setBlurRadius(radius /
 * blurReduction)`), o que entrega um QUARTO do desfoque: os 60 do painel
 * escuro viram raio 15, e o fundo do modal vira 7,5. Nessa faixa o efeito
 * aparece em alguns aparelhos e some em outros — foi o que se viu testando em
 * dois Androids diferentes.
 *
 * O valor é decidido em RUNTIME por `Platform.Version` (o nível de API), não
 * fixado no código: não há um número que sirva aos dois renderizadores.
 *
 * - **API 31+ (RenderEffect, GPU):** 2 — devolve metade do caminho (painel
 *   escuro em raio 30). Não vai a 1 porque ali o desfoque passa a engolir o
 *   conteúdo de trás em vez de sugeri-lo. **É este o número a mexer se ficar
 *   forte ou fraco demais.**
 * - **Abaixo de 31 (RenderScript, legado):** mantém 4. Subir o raio custa mais
 *   justamente no caminho mais lento, e nos aparelhos menos capazes de pagar —
 *   ali um vidro discreto é melhor troca que uma rolagem travada.
 */
export const androidBlurReduction =
  Platform.OS === 'android'
    ? Number(Platform.Version) >= ANDROID_RENDER_EFFECT_API
      ? 2
      : 4
    : undefined;

/**
 * Este aparelho vai desfocar pelo caminho legado (RenderScript, Android 11 e
 * anteriores)? Ver `ANDROID_RENDER_EFFECT_API`.
 */
export const WEAK_BLUR =
  Platform.OS === 'android' &&
  Number(Platform.Version) < ANDROID_RENDER_EFFECT_API;

/** Troca só o alfa de uma cor `rgba(...)`, preservando o matiz. */
function reAlpha(rgba: string, alpha: number): string {
  return rgba.replace(
    /rgba?\(([^,]+),([^,]+),([^,)]+)(?:,[^)]+)?\)/,
    (_, r, g, b) => `rgba(${r.trim()},${g.trim()},${b.trim()},${alpha})`,
  );
}

/**
 * Ajusta os tokens para o caminho de desfoque fraco.
 *
 * O `tint` de 55% existe porque o desfoque faz os outros 45%: o que se vê
 * atrás do painel deveria estar BORRADO. Onde o desfoque mal acontece, o que
 * atravessa é conteúdo nítido e legível — e aí o painel não lê como vidro
 * discreto, lê como painel quebrado. Foi disso que veio o "lavado".
 *
 * A compensação é simples: o painel assume ser uma SUPERFÍCIE, quase opaca,
 * com a borda um pouco mais firme para se destacar sem contar com o desfoque.
 * E, como quase nada atravessa, o raio cai junto — o borrão caro do
 * RenderScript deixa de ser pago por um efeito que já não se vê.
 *
 * O que NÃO muda: brilho de topo, reflexo especular e a animação de entrada.
 * São transform/opacidade, custam quase nada e funcionam em qualquer Android —
 * é o que mantém o painel vivo mesmo sem o vidro.
 */
export function compensateWeakBlur(g: GlassTokens): GlassTokens {
  if (!WEAK_BLUR) return g;
  return {
    ...g,
    tint: reAlpha(g.tint, 0.94),
    border: reAlpha(g.border, g.blurTint === 'dark' ? 0.16 : 0.9),
    backdropScrim: reAlpha(
      g.backdropScrim,
      g.blurTint === 'dark' ? 0.6 : 0.35,
    ),
    blurIntensity: 24,
    backdropIntensity: 12,
  };
}

// Só em desenvolvimento: ao abrir o app num Android, o console do Metro passa a
// dizer QUAL aparelho é e qual caminho de desfoque ele pegou. Existe porque a
// versão do Android nem sempre está à mão — e sem ela, "o vidro não aparece
// nesse celular" não tem como ser diagnosticado à distância.
if (__DEV__ && Platform.OS === 'android') {
  const api = Number(Platform.Version);
  console.log(
    `[Blink/vidro] Android API ${api} · ${
      api >= ANDROID_RENDER_EFFECT_API
        ? `RenderEffect (GPU) · vidro real · reduction ${androidBlurReduction}`
        : 'RenderScript (legado) · superfície opaca (compensateWeakBlur)'
    }`,
  );
}
