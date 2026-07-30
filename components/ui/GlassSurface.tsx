import React, { useEffect } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type ViewProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useGlass } from '@/hooks/useGlass';
import { useSettings } from '@/contexts/SettingsContext';
import {
  glassShadow,
  androidBlurMethod,
  androidBlurReduction,
  GLASS_TRANSITION_MS,
  GLASS_SPECULAR_MS,
  GLASS_SPECULAR_WIDTH,
} from '@/constants/glass';
import { cardShadow } from '@/components/ui/Card';
import { CARD_RADIUS } from '@/constants/radius';

/** Raio padrão de uma superfície. */
const DEFAULT_RADIUS = CARD_RADIUS;

// Só um componente animado do Reanimated consegue dirigir a prop `intensity`
// do BlurView por frame — daí o wrapper em vez do BlurView cru.
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Escala inicial ao materializar — sutil, é assentar, não "pipocar". */
const MATERIALIZE_FROM = 0.96;

interface GlassSurfaceProps extends ViewProps {
  /**
   * Liga o desfoque REAL (BlurView, view nativa).
   *
   * Use SÓ onde há conteúdo variado atrás: modais, sheets, elementos
   * flutuantes sobre a tela. Sobre o fundo chapado do app não há o que borrar
   * — o custo seria pago à toa, e numa lista longa (um BlurView por item)
   * custa frames de rolagem.
   */
  blur?: boolean;
  /** Raio dos cantos. Numérico porque o recorte do BlurView depende dele. */
  radius?: number;
  /** Brilho no topo. Desligue em superfícies muito baixas, onde vira faixa. */
  sheen?: boolean;
  /**
   * Materializa o vidro ao montar (desfoque 0 → cheio + leve escala) e passa
   * UMA vez com o reflexo especular. Só faz sentido com `blur`: é a entrada de
   * um painel que acabou de aparecer (modal/sheet), não de algo que já estava
   * na tela. Respeita `reduceMotion`.
   */
  animated?: boolean;
  className?: string;
}

/**
 * Superfície de vidro do app: fundo + borda fina de luz + brilho no topo.
 *
 * Sem `blur`, é o "look" de vidro a custo de uma `View` comum (o que faz
 * sentido sobre fundo chapado, onde desfocar não mudaria nada). Com `blur`,
 * entra o BlurView de verdade.
 */
export function GlassSurface({
  blur = false,
  radius = DEFAULT_RADIUS,
  sheen = true,
  animated = false,
  className,
  style,
  children,
  ...props
}: GlassSurfaceProps) {
  const colors = useThemeColors();
  const glass = useGlass();
  const { settings } = useSettings();

  // 0 → 1 ao montar. Dirige desfoque, opacidade e escala de uma vez só, para
  // as três chegarem juntas (tempos separados fazem o painel parecer montado
  // em pedaços).
  const enter = useSharedValue(animated && blur ? 0 : 1);
  useEffect(() => {
    if (!animated || !blur) return;
    if (settings.reduceMotion) {
      enter.value = 1;
      return;
    }
    enter.value = withTiming(1, {
      duration: GLASS_TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [animated, blur, settings.reduceMotion, enter]);

  const blurProps = useAnimatedProps(() => ({
    intensity: interpolate(enter.value, [0, 1], [0, glass.blurIntensity]),
  }));

  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { scale: interpolate(enter.value, [0, 1], [MATERIALIZE_FROM, 1]) },
    ],
  }));

  const edge = {
    borderRadius: radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.border,
  };

  // `pointerEvents="none"` para o brilho nunca roubar toque do conteúdo.
  const sheenLayer = sheen ? (
    <LinearGradient
      pointerEvents="none"
      colors={glass.sheen}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.6 }}
      style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
    />
  ) : null;

  if (!blur) {
    return (
      <View
        className={className}
        style={[
          { backgroundColor: colors.surfaceContainer },
          edge,
          cardShadow,
          style,
        ]}
        {...props}
      >
        {children}
        {sheenLayer}
      </View>
    );
  }

  return (
    <Animated.View
      className={className}
      // O tint vive AQUI, não no BlurView: no Android a sombra por `elevation`
      // só existe se a view tiver fundo (é dele que sai o contorno), e o
      // recorte (`overflow: hidden`) precisa ficar no filho, senão comeria a
      // própria sombra.
      style={[
        { borderRadius: radius, backgroundColor: glass.tint },
        glassShadow,
        style,
        animated ? enterStyle : null,
      ]}
      {...props}
    >
      {animated ? (
        <AnimatedBlurView
          animatedProps={blurProps}
          tint={glass.blurTint}
          experimentalBlurMethod={androidBlurMethod}
        blurReductionFactor={androidBlurReduction}
          style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, edge]}
        />
      ) : (
        <BlurView
          intensity={glass.blurIntensity}
          tint={glass.blurTint}
          experimentalBlurMethod={androidBlurMethod}
        blurReductionFactor={androidBlurReduction}
          style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, edge]}
        />
      )}

      {children}
      {sheenLayer}

      {/* Reflexo POR CIMA do conteúdo: é luz na superfície do vidro, não atrás
          dele. Recorte próprio para a faixa não vazar pelos cantos. */}
      {animated && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius, overflow: 'hidden' },
          ]}
        >
          <GlassSpecular />
        </View>
      )}
    </Animated.View>
  );
}

/**
 * Camadas animadas de um painel de vidro (desfoque que se materializa +
 * reflexo especular varrendo uma vez), para colar como PRIMEIRO filho de um
 * painel que o chamador já estiliza.
 *
 * Existe porque os bottom sheets do app têm painel `Pressable` (precisam de
 * `stopPropagation` para o toque dentro não fechar o sheet) — não dá para
 * trocá-los pelo `GlassSurface` inteiro sem perder isso. Antes cada um repetia
 * o mesmo `<BlurView absoluteFill>` copiado à mão.
 *
 * O painel precisa ter `overflow: hidden` (todos já têm, via `rounded-t-3xl
 * overflow-hidden`), senão o reflexo vaza pelos cantos.
 */
export function AnimatedGlassFill() {
  const glass = useGlass();
  const { settings } = useSettings();
  const enter = useSharedValue(0);

  useEffect(() => {
    if (settings.reduceMotion) {
      enter.value = 1;
      return;
    }
    enter.value = withTiming(1, {
      duration: GLASS_TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [settings.reduceMotion, enter]);

  const blurProps = useAnimatedProps(() => ({
    intensity: interpolate(enter.value, [0, 1], [0, glass.blurIntensity]),
  }));

  return (
    <AnimatedBlurView
      animatedProps={blurProps}
      tint={glass.blurTint}
      experimentalBlurMethod={androidBlurMethod}
        blurReductionFactor={androidBlurReduction}
      style={StyleSheet.absoluteFill}
    />
  );
}

/**
 * Reflexo especular — a faixa de luz que varre a superfície UMA vez ao ela
 * aparecer. É o traço que separa o Liquid Glass do glassmorphism comum.
 *
 * Vai como ÚLTIMO filho do painel, não o primeiro: luz especular é reflexo NA
 * superfície do vidro, então tem de passar POR CIMA do conteúdo. Na primeira
 * versão ela era o primeiro filho e o texto/botões do painel cobriam justamente
 * a faixa — por isso não se via nada.
 *
 * O painel precisa ter `overflow: hidden`, senão a faixa vaza pelos cantos.
 */
export function GlassSpecular() {
  const glass = useGlass();
  const { settings } = useSettings();
  const { width: screenW } = useWindowDimensions();
  const sweep = useSharedValue(0);

  useEffect(() => {
    if (settings.reduceMotion) {
      sweep.value = 1;
      return;
    }
    sweep.value = withTiming(1, {
      duration: GLASS_SPECULAR_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [settings.reduceMotion, sweep]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(sweep.value, [0, 0.12, 0.8, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateX: interpolate(
          sweep.value,
          [0, 1],
          [-GLASS_SPECULAR_WIDTH, screenW],
        ),
      },
      { rotate: '18deg' },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          // Sobra em cima/embaixo para a faixa INCLINADA cobrir o painel
          // inteiro — sem isso as pontas dela deixariam cantos sem luz.
          top: -80,
          bottom: -80,
          width: GLASS_SPECULAR_WIDTH,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={glass.specular}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/**
 * Botão de vidro que RESPONDE AO TOQUE: ao pressionar, o desfoque afrouxa e a
 * superfície recua levemente — como se o vidro cedesse sob o dedo. É a parte
 * "context-aware" do Liquid Glass que dá para fazer sem shader.
 *
 * Usa `Pressable` (não `TouchableOpacity`) porque precisa de `onPressIn`/`Out`
 * separados: com opacidade global o vidro inteiro apagaria, em vez de o
 * MATERIAL reagir.
 */
export function GlassPressable({
  radius = DEFAULT_RADIUS,
  onPress,
  disabled = false,
  className,
  style,
  children,
  accessibilityLabel,
}: {
  radius?: number;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  style?: ViewProps['style'];
  children?: React.ReactNode;
  accessibilityLabel?: string;
}) {
  const glass = useGlass();
  const { settings } = useSettings();
  const press = useSharedValue(0);

  const set = (v: number) => {
    press.value = settings.reduceMotion
      ? v
      : withTiming(v, {
          duration: GLASS_TRANSITION_MS / 2,
          easing: Easing.out(Easing.cubic),
        });
  };

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.97]) }],
  }));

  // O desfoque AFROUXA no toque (não aperta): vidro pressionado deixa passar
  // mais do que está atrás — é o que vende a ideia de material, não de botão.
  const blurProps = useAnimatedProps(() => ({
    intensity: interpolate(
      press.value,
      [0, 1],
      [glass.blurIntensity, glass.blurIntensity * 0.55],
    ),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => set(1)}
      onPressOut={() => set(0)}
      className={className}
      style={[
        {
          borderRadius: radius,
          backgroundColor: glass.tint,
          opacity: disabled ? 0.5 : 1,
        },
        glassShadow,
        style,
        pressStyle,
      ]}
    >
      <AnimatedBlurView
        animatedProps={blurProps}
        tint={glass.blurTint}
        experimentalBlurMethod={androidBlurMethod}
        blurReductionFactor={androidBlurReduction}
        style={[
          StyleSheet.absoluteFill,
          {
            overflow: 'hidden',
            borderRadius: radius,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: glass.border,
          },
        ]}
      />
      {children}
      <LinearGradient
        pointerEvents="none"
        colors={glass.sheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
    </AnimatedPressable>
  );
}

/**
 * Aresta de vidro para superfícies feitas À MÃO — as que não passam pelo
 * `Card`/`GlassSurface` porque são `TouchableOpacity`, linhas de lista ou
 * blocos com layout próprio. Espalhe no `style` junto da sombra:
 *
 *     const edge = useGlassEdge();
 *     <TouchableOpacity style={[cardShadow, edge]}>
 *       <GlassSheen />
 *
 * Existe para o app não ficar com duas linguagens visuais convivendo na mesma
 * tela (card com borda de luz ao lado de card sem nada).
 */
export function useGlassEdge() {
  const glass = useGlass();
  return {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.border,
  };
}

/**
 * Brilho do topo, para colar dentro de uma superfície feita à mão. Precisa ser
 * o PRIMEIRO filho (fica atrás do conteúdo) e não captura toque.
 */
export function GlassSheen({ radius = DEFAULT_RADIUS }: { radius?: number }) {
  const glass = useGlass();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={glass.sheen}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.6 }}
      style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
    />
  );
}

/**
 * Fundo desfocado atrás de um modal — o efeito de vidro mais visível do app,
 * porque aqui existe a tela inteira por trás para borrar (ao contrário dos
 * cards). Substitui o `bg-black/60` chapado que os modais usavam.
 *
 * Não captura toque: o `Pressable` de fechar que envolve continua recebendo.
 */
export function GlassBackdrop() {
  const glass = useGlass();
  return (
    <BlurView
      pointerEvents="none"
      intensity={glass.backdropIntensity}
      tint={glass.blurTint}
      experimentalBlurMethod={androidBlurMethod}
        blurReductionFactor={androidBlurReduction}
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: glass.backdropScrim },
      ]}
    />
  );
}
