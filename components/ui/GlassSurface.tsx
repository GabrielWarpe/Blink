import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useGlass } from '@/hooks/useGlass';
import { glassShadow, androidBlurMethod } from '@/constants/glass';
import { cardShadow } from '@/components/ui/Card';
import { CARD_RADIUS } from '@/constants/radius';

/** Raio padrão de uma superfície. */
const DEFAULT_RADIUS = CARD_RADIUS;

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
  className,
  style,
  children,
  ...props
}: GlassSurfaceProps) {
  const colors = useThemeColors();
  const glass = useGlass();

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
    <View
      className={className}
      // O tint vive AQUI, não no BlurView: no Android a sombra por `elevation`
      // só existe se a view tiver fundo (é dele que sai o contorno), e o
      // recorte (`overflow: hidden`) precisa ficar no filho, senão comeria a
      // própria sombra. Mesma estrutura do FloatingTabBar.
      style={[
        { borderRadius: radius, backgroundColor: glass.tint },
        glassShadow,
        style,
      ]}
      {...props}
    >
      <BlurView
        intensity={glass.blurIntensity}
        tint={glass.blurTint}
        experimentalBlurMethod={androidBlurMethod}
        style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, edge]}
      />
      {children}
      {sheenLayer}
    </View>
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
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: glass.backdropScrim },
      ]}
    />
  );
}
