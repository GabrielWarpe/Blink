import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettings } from '@/contexts/SettingsContext';
import { TAB_ICON_SIZE, TAB_TRANSITION_MS } from '@/constants/layout';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Nome BASE do ícone: a variante inativa é sempre `${base}-outline`. */
export type TabIconName = Extract<
  IoniconName,
  'home' | 'albums' | 'earth' | 'stats-chart' | 'person'
>;

interface TabBarIconProps {
  icon: TabIconName;
  focused: boolean;
  /** Se presente, mostra a foto do usuário no lugar do ícone. */
  avatarUri?: string | null;
}

/** Escala do conteúdo na aba ativa — leve de propósito, é acento, não salto. */
const ACTIVE_SCALE = 1.06;
/** Opacidade da FOTO quando a aba não está ativa. Ver `avatarStyle`. */
const AVATAR_INACTIVE_OPACITY = 0.5;

/**
 * Conteúdo de uma aba: só o ícone, sem rótulo — o padrão do X, nas duas
 * plataformas. Sem o texto embaixo, a barra fica com metade dos elementos e o
 * ícone pode crescer (ver `TAB_ICON_SIZE`), que é o que dá a leitura limpa.
 *
 * O ícone é renderizado DUAS vezes (contorno na cor inativa e preenchido na
 * ativa), sobreposto, e a transição é um cross-fade de opacidade. Isso resolve
 * de uma vez a troca do glifo e a mudança de cor — tudo em opacidade, que é a
 * propriedade mais barata de animar e não depende de animar a cor de uma fonte
 * de ícone (frágil).
 *
 * Na aba Perfil, a foto do usuário substitui o glifo. Sem foto, cai no
 * bonequinho como qualquer outra aba — sem inicial nem placeholder próprio.
 */
export function TabBarIcon({ icon, focused, avatarUri }: TabBarIconProps) {
  const colors = useThemeColors();
  const { settings } = useSettings();

  // 0 = inativo, 1 = ativo. Uma única fonte para escala e cross-fade.
  const progress = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    const target = focused ? 1 : 0;
    progress.value = settings.reduceMotion
      ? target
      : withTiming(target, {
          duration: TAB_TRANSITION_MS,
          easing: Easing.out(Easing.cubic),
        });
  }, [focused, settings.reduceMotion, progress]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, ACTIVE_SCALE]) },
    ],
  }));
  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));
  const activeIconStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  /**
   * A foto não tem variante "preenchida" para trocar, e o anel que marcava o
   * foco saiu a pedido. Sobra a opacidade: apagada quando inativa, cheia quando
   * ativa — o mesmo contraste que separa contorno de preenchido nas outras
   * abas, só que aplicado à imagem.
   */
  const avatarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [AVATAR_INACTIVE_OPACITY, 1]),
  }));

  return (
    <Animated.View
      style={[{ alignItems: 'center', justifyContent: 'center' }, scaleStyle]}
    >
      {avatarUri ? (
        <Animated.View
          style={[
            {
              width: TAB_ICON_SIZE,
              height: TAB_ICON_SIZE,
              borderRadius: TAB_ICON_SIZE / 2,
              // Recorte circular SEM borda: o raio faz a máscara e o
              // `overflow` a aplica à imagem. Nenhum anel em volta.
              overflow: 'hidden',
            },
            avatarStyle,
          ]}
        >
          <Image source={{ uri: avatarUri }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : (
        <View style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE }}>
          <Animated.View style={[StyleSheet.absoluteFill, inactiveIconStyle]}>
            <Ionicons
              name={`${icon}-outline` as IoniconName}
              size={TAB_ICON_SIZE}
              color={colors.outline}
            />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, activeIconStyle]}>
            <Ionicons
              name={icon}
              size={TAB_ICON_SIZE}
              color={colors.onSurface}
            />
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}
