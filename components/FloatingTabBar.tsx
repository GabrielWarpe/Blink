import React, { useEffect, useState } from 'react';
import { Pressable, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettings } from '@/contexts/SettingsContext';
import { useTabBarCollapse } from '@/contexts/TabBarContext';
import {
  TAB_ICON_SIZE,
  TAB_BAR_HEIGHT,
  TAB_BAR_HEIGHT_COMPACT,
  TAB_BAR_PAD,
  TAB_ITEM_HEIGHT,
  TAB_ITEM_HEIGHT_COMPACT,
  TAB_ITEM_INSET,
  TAB_ITEM_RADIUS,
  TAB_BAR_RADIUS,
  TAB_BAR_SIDE_MARGIN,
  TAB_BAR_BOTTOM_MARGIN,
  TAB_TRANSITION_MS,
} from '@/constants/layout';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Sombra da barra flutuante: larga, difusa e de baixa opacidade. É profundidade
 * sutil, não um contorno escuro — sombra dura mata a leitura de "vidro".
 */
const barShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  android: { elevation: 8 },
  default: {},
});

/**
 * Vidro: tint sobre o desfoque + realce de borda.
 *
 * São valores do componente que NÃO saem de token de tema, e por um motivo:
 * vidro é alfa sobre o que está atrás, não uma cor da paleta. O tint nasce do
 * `surfaceContainer` de cada tema com alfa; a borda é um realce branco (a luz
 * "pegando" a quina do vidro), como em iOS/Instagram.
 *
 * Alfa BAIXO de propósito: acima de ~0,5 o vidro vira cor chapada e o desfoque
 * deixa de ser perceptível — que foi exatamente o problema da primeira versão.
 * Reduzido de novo aqui (mais "liquid glass" = mais transparência real, não só
 * mais desfoque) — a borda subiu um pouco no escuro pra compensar, senão a
 * barra perde contorno contra fundos escuros.
 */
const GLASS = {
  dark: {
    tint: 'rgba(18,18,18,0.32)',
    border: 'rgba(255,255,255,0.20)',
    // Pílula da aba ativa. É um REALCE DO PRÓPRIO VIDRO (branco de alfa
    // baixo), não `primaryContainer`: com o destaque monocromático, aquele
    // token virou branco quase sólido, e a pílula passou a ser a coisa mais
    // clara da tela inteira — gritava em vez de marcar. Assim ela lê como
    // "esta parte do vidro está acesa".
    indicator: 'rgba(255,255,255,0.14)',
  },
  light: {
    tint: 'rgba(248,248,246,0.38)',
    border: 'rgba(255,255,255,0.85)',
    indicator: 'rgba(0,0,0,0.07)',
  },
};

/**
 * Brilho no topo do vidro — a luz "pegando" a superfície, como no material
 * "liquid glass" da Apple. Um gradiente MUITO sutil (alfa baixo, esmaece em
 * 55% da altura), renderizado por cima de tudo (`pointerEvents="none"`, então
 * nunca captura toque) para não competir com ícone/rótulo.
 */
const SHEEN = {
  dark: ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)'] as const,
  light: ['rgba(255,255,255,0.30)', 'rgba(255,255,255,0)'] as const,
};

/** Mola da troca de aba: leve avanço no fim, sem tremor. */
const SLIDE_SPRING = { duration: TAB_TRANSITION_MS, dampingRatio: 0.82 };

/**
 * Barra de abas de vidro flutuante.
 *
 * Substitui a barra padrão do react-navigation (`tabBar` render-prop) para
 * poder desenhar o próprio contêiner: desfoque de fundo, cantos arredondados
 * (raio fixo e moderado — NÃO `altura / 2`, ver `TAB_BAR_RADIUS`), margem das
 * bordas, o indicador que DESLIZA entre as abas e o encolhimento na rolagem. As
 * ROTAS e os ÍCONES seguem declarados em `app/(tabs)/_layout.tsx` — aqui só se
 * chama o `tabBarIcon` de cada rota.
 */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const colors = useThemeColors();
  const { settings } = useSettings();
  const { colorScheme } = useColorScheme();
  const collapsed = useTabBarCollapse();
  // Mesma regra do `useThemeColors`: só 'light' é claro (indefinido cai no
  // escuro). Com `=== 'dark'` o vidro sairia claro sobre a paleta escura.
  const dark = colorScheme !== 'light';
  const glass = dark ? GLASS.dark : GLASS.light;

  // Largura real da barra: o indicador precisa saber o tamanho da célula, e ele
  // varia com a largura da tela. Medido uma vez no layout.
  const [barWidth, setBarWidth] = useState(0);
  const cellWidth =
    barWidth > 0 ? (barWidth - TAB_BAR_PAD * 2) / state.routes.length : 0;

  // Posição do indicador em CÉLULAS (não em pixels): assim uma rotação de tela
  // reposiciona sozinho, sem reanimar.
  const cell = useSharedValue(state.index);
  useEffect(() => {
    cell.value = settings.reduceMotion
      ? state.index
      : withSpring(state.index, SLIDE_SPRING);
  }, [state.index, settings.reduceMotion, cell]);

  const barStyle = useAnimatedStyle(() => ({
    height: interpolate(
      collapsed.value,
      [0, 1],
      [TAB_BAR_HEIGHT, TAB_BAR_HEIGHT_COMPACT],
    ),
  }));

  // O desfoque afrouxa junto com o encolhimento: barra menor pede menos peso.
  // Valores mais altos que antes (mais "liquid glass") — o tint mais baixo
  // (ver GLASS) só lê como vidro de verdade com desfoque forte por trás.
  const blurProps = useAnimatedProps(() => ({
    intensity: interpolate(
      collapsed.value,
      [0, 1],
      [dark ? 72 : 85, dark ? 50 : 62],
    ),
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    height: interpolate(
      collapsed.value,
      [0, 1],
      [TAB_ITEM_HEIGHT, TAB_ITEM_HEIGHT_COMPACT],
    ),
    transform: [{ translateX: cell.value * cellWidth }],
  }));

  const itemStyle = useAnimatedStyle(() => ({
    height: interpolate(
      collapsed.value,
      [0, 1],
      [TAB_ITEM_HEIGHT, TAB_ITEM_HEIGHT_COMPACT],
    ),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: TAB_BAR_SIDE_MARGIN,
          right: TAB_BAR_SIDE_MARGIN,
          bottom: insets.bottom + TAB_BAR_BOTTOM_MARGIN,
          borderRadius: TAB_BAR_RADIUS,
          // O tint vive AQUI, não no BlurView: no Android a sombra por
          // `elevation` só existe se a view tiver fundo (é dele que sai o
          // contorno). Recortar (`overflow: hidden`) fica com o filho, senão o
          // recorte comeria a própria sombra.
          backgroundColor: glass.tint,
        },
        barShadow,
        barStyle,
      ]}
      onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
    >
      <AnimatedBlurView
        animatedProps={blurProps}
        tint={dark ? 'dark' : 'light'}
        // No Android o desfoque real depende deste método (a Expo o marca como
        // experimental). Se ele degradar, o tint acima ainda segura a leitura
        // de vidro — a barra nunca fica transparente/quebrada.
        experimentalBlurMethod={
          Platform.OS === 'android' ? 'dimezisBlurView' : undefined
        }
        style={[
          StyleSheet.absoluteFill,
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: TAB_BAR_PAD,
            borderRadius: TAB_BAR_RADIUS,
            overflow: 'hidden',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: glass.border,
          },
        ]}
      >
        {cellWidth > 0 && (
          <Animated.View
            // Indicador único que desliza, em vez de um fundo por aba: é o que
            // dá a sensação de continuidade entre as abas.
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: TAB_BAR_PAD + TAB_ITEM_INSET,
                top: TAB_BAR_PAD,
                width: cellWidth - TAB_ITEM_INSET * 2,
                borderRadius: TAB_ITEM_RADIUS,
                backgroundColor: glass.indicator,
              },
              indicatorStyle,
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <AnimatedPressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={() =>
                navigation.emit({ type: 'tabLongPress', target: route.key })
              }
              style={[
                { flex: 1, alignItems: 'center', justifyContent: 'center' },
                itemStyle,
              ]}
            >
              {options.tabBarIcon?.({
                focused,
                // A cor real é resolvida dentro do ícone (ele faz o cross-fade
                // entre inativo e ativo); aqui só se cumpre a assinatura.
                color: colors.outline,
                size: TAB_ICON_SIZE,
              })}
            </AnimatedPressable>
          );
        })}

        <LinearGradient
          pointerEvents="none"
          colors={dark ? SHEEN.dark : SHEEN.light}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.55 }}
          style={StyleSheet.absoluteFill}
        />
      </AnimatedBlurView>
    </Animated.View>
  );
}
