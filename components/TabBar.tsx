import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettings } from '@/contexts/SettingsContext';
import { useTabBarCollapse } from '@/contexts/TabBarContext';
import {
  TAB_ICON_SIZE,
  TAB_BAR_HEIGHT,
  TAB_BAR_PAD_V,
} from '@/constants/layout';

/**
 * Barra de abas do app: largura cheia, opaca e colada no fundo.
 *
 * Substitui a barra padrão do react-navigation (`tabBar` render-prop) só para
 * poder desenhar o próprio contêiner e animar a saída na rolagem. As ROTAS e os
 * ÍCONES seguem declarados em `app/(tabs)/_layout.tsx` — aqui só se chama o
 * `tabBarIcon` de cada rota.
 *
 * **Por que não é mais a pílula flutuante em vidro.** Aquele desenho é
 * vocabulário do iOS (cápsula, desfoque, sombra difusa). Fora dele não se
 * sustenta: o desfoque depende do renderizador do aparelho (ver
 * `constants/glass.ts`), a cápsula estreitava a célula de cada aba a ponto de
 * truncar "Comunidade" em tela pequena, e a sombra difusa vira um bloco cinza
 * no Android. A barra plena resolve os três de uma vez e é o padrão que o X usa
 * NAS DUAS plataformas — um desenho só, previsível em qualquer aparelho.
 *
 * Nada de vidro aqui, então: sem `BlurView`, sem tint translúcido, sem
 * indicador deslizante. A aba ativa se lê pelo ícone preenchido e pela cor,
 * como no X (ver `TabBarIcon`).
 */
export function TabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const colors = useThemeColors();
  const { settings } = useSettings();
  const collapsed = useTabBarCollapse();

  // Altura total, já com o inset seguro: é exatamente o quanto a barra precisa
  // descer para sumir por completo, sem deixar uma faixa presa na borda.
  const totalHeight = TAB_BAR_HEIGHT + insets.bottom;

  // A rolagem escreve `collapsed` (0..1) na thread de UI. Aqui ele deixa de
  // encolher a barra e passa a DESLIZÁ-LA para fora — sem rótulo recolhendo,
  // encolher não teria o que ganhar, e sair devolve a tela inteira ao conteúdo.
  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: collapsed.value * totalHeight }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          alignItems: 'flex-start',
          height: totalHeight,
          paddingTop: TAB_BAR_PAD_V,
          // O inset seguro vira respiro POR BAIXO do conteúdo: a barra encosta
          // no fundo do aparelho, mas ícone e rótulo não caem sobre o
          // indicador de home nem sobre os botões do Android.
          paddingBottom: insets.bottom,
          backgroundColor: colors.background,
          // Fio de separação no topo, no lugar da sombra: uma barra colada não
          // flutua, e sombra aqui só sujaria a emenda com o conteúdo.
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.outlineVariant,
        },
        barStyle,
      ]}
    >
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
          <TabSlot
            key={route.key}
            focused={focused}
            reduceMotion={settings.reduceMotion}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={() =>
              navigation.emit({ type: 'tabLongPress', target: route.key })
            }
          >
            {options.tabBarIcon?.({
              focused,
              // A cor real é resolvida dentro do ícone (ele faz o cross-fade
              // entre inativo e ativo); aqui só se cumpre a assinatura.
              color: colors.outline,
              size: TAB_ICON_SIZE,
            })}
          </TabSlot>
        );
      })}
    </Animated.View>
  );
}

interface TabSlotProps {
  focused: boolean;
  reduceMotion: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
  children: React.ReactNode;
}

/**
 * Uma célula da barra, com a resposta ao toque.
 *
 * Existe como componente próprio porque a animação de toque precisa de um
 * `useSharedValue` POR ABA — declará-los dentro do `.map()` da barra quebraria
 * a regra dos hooks. Substitui o realce que o indicador deslizante dava: sem
 * pílula, o retorno tátil vem de a própria célula recuar sob o dedo.
 */
function TabSlot({
  focused,
  reduceMotion,
  accessibilityLabel,
  onPress,
  onLongPress,
  children,
}: TabSlotProps) {
  const press = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) press.value = 0;
  }, [reduceMotion, press]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(press.value, [0, 1], [1, 0.55]),
  }));

  const to = (v: number) => {
    press.value = reduceMotion
      ? 0
      : withTiming(v, { duration: 120, easing: Easing.out(Easing.quad) });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => to(1)}
      onPressOut={() => to(0)}
      style={{ flex: 1 }}
    >
      <Animated.View style={[{ alignItems: 'center' }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
