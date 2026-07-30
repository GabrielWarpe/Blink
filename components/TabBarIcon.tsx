import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettings } from '@/contexts/SettingsContext';
import {
  TAB_ICON_SIZE,
  TAB_LABEL_SIZE,
  TAB_LABEL_LINE,
  TAB_LABEL_BLOCK,
  TAB_TRANSITION_MS,
} from '@/constants/layout';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Nome BASE do ícone: a variante inativa é sempre `${base}-outline`. */
export type TabIconName = Extract<
  IoniconName,
  'home' | 'albums' | 'earth' | 'stats-chart' | 'person'
>;

interface TabBarIconProps {
  icon: TabIconName;
  label: string;
  focused: boolean;
  /** Se presente, mostra a foto do usuário no lugar do ícone. */
  avatarUri?: string | null;
}

/** Escala do conteúdo na aba ativa — leve de propósito, é acento, não salto. */
const ACTIVE_SCALE = 1.06;

/**
 * Conteúdo de uma aba: ícone + rótulo, com transição fluida entre inativo e
 * ativo.
 *
 * Ícone e rótulo são renderizados DUAS vezes (contorno/Medium na cor inativa e
 * preenchido/SemiBold na cor ativa), sobrepostos, e a transição é um cross-fade
 * de opacidade. Isso resolve de uma vez a troca do glifo, a troca do peso da
 * fonte e a mudança de cor — tudo em opacidade, que é a propriedade mais barata
 * de animar e não depende de animar a cor de uma fonte de ícone (frágil).
 *
 * O ativo usa `onSurface` (claro), não `onPrimaryContainer` (escuro): não há
 * mais pílula por trás do item — o realce é o próprio ícone/rótulo contra o
 * fundo da barra, e cor escura ali ficaria ilegível.
 */
export function TabBarIcon({
  icon,
  label,
  focused,
  avatarUri,
}: TabBarIconProps) {
  const colors = useThemeColors();
  const { settings } = useSettings();

  // 0 = inativo, 1 = ativo. Uma única fonte para escala, cor e cross-fade.
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
  // Cross-fade entre as duas variantes sobrepostas — nada mais entra na conta:
  // o rótulo está sempre visível desde que a barra deixou de encolher.
  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));
  const activeIconStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const inactiveLabelStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));
  const activeLabelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));
  // Cor→cor (nunca partindo de 'transparent'): interpolar a partir de um alfa
  // zero passa por cinzas no meio do caminho e suja o anel.
  const avatarRingStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.outline, colors.onSurface],
    ),
  }));

  /**
   * Teto do fator de fonte do sistema, SÓ para o rótulo da barra.
   *
   * O `lineHeight` aqui é fixo (`TAB_LABEL_LINE`, 12) e a altura da barra é
   * derivada dele, então o texto não tem para onde crescer: a partir de ~130%
   * ele começa a ser cortado na vertical. O Android põe o ajuste de fonte (e o
   * de "tamanho de exibição") a dois toques nas configurações, então isso é
   * cenário comum, não caso de borda. 1.2 é o ponto em que ainda cabe.
   *
   * Vale APENAS aqui — o resto do app continua acompanhando a fonte do sistema
   * sem limite, porque lá o texto pode empurrar o layout.
   */
  const LABEL_MAX_FONT_SCALE = 1.2;

  const labelBase = {
    position: 'absolute' as const,
    bottom: 0,
    width: '100%' as const,
    fontSize: TAB_LABEL_SIZE,
    lineHeight: TAB_LABEL_LINE,
    // Sem espaçamento extra: em "Comunidade" os 0.2 antigos somavam ~2px, e
    // são exatamente os px que faltam para o texto caber dentro da curva da
    // pílula ativa (ver TAB_ITEM_RADIUS).
    letterSpacing: 0,
    textAlign: 'center' as const,
  };

  return (
    <Animated.View
      style={[
        {
          width: '100%',
          paddingHorizontal: 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        scaleStyle,
      ]}
    >
      {avatarUri ? (
        <Animated.View
          style={[
            {
              width: TAB_ICON_SIZE,
              height: TAB_ICON_SIZE,
              borderRadius: TAB_ICON_SIZE / 2,
              // Anel sempre presente: só a COR anima (inativa → ativa), senão a
              // espessura saltaria de 0 para 2 num único frame.
              borderWidth: 2,
              overflow: 'hidden',
            },
            avatarRingStyle,
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

      {/* Altura fixa: as duas variantes do rótulo são sobrepostas
          (`position: absolute`), então sem ela o bloco fecharia em zero. */}
      <View style={{ width: '100%', height: TAB_LABEL_BLOCK }}>
        <Animated.Text
          numberOfLines={1}
          maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
          style={[
            labelBase,
            // Medium (não Regular) no inativo: o peso 400 fica lavado no escuro.
            { color: colors.outline, fontFamily: 'Inter_500Medium' },
            inactiveLabelStyle,
          ]}
        >
          {label}
        </Animated.Text>
        <Animated.Text
          numberOfLines={1}
          maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
          style={[
            labelBase,
            {
              color: colors.onSurface,
              fontFamily: 'Inter_600SemiBold',
            },
            activeLabelStyle,
          ]}
        >
          {label}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}
