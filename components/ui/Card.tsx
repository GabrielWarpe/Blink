import React from 'react';
import { View, Platform, StyleSheet, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useGlass } from '@/hooks/useGlass';
import { CARD_RADIUS } from '@/constants/radius';

interface CardProps extends ViewProps {
  /**
   * Nível de destaque:
   * - 'flat': superfície base, sem sombra (blocos secundários agrupados).
   * - 'raised' (padrão): superfície elevada com sombra suave — a hierarquia
   *   passa a vir de profundidade, não da antiga borda cinza.
   */
  level?: 'flat' | 'raised';
  className?: string;
}

// Sombra sutil (quase imperceptível sobre o fundo escuro, mas separa o card do
// plano). No iOS via shadow*, no Android via elevation. Exportada para outros
// componentes clicáveis (ex.: DeckCard) reusarem a MESMA elevação.
export const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
});

const RAISED = cardShadow;

/**
 * Superfície padrão do app, com o tratamento de vidro: fundo
 * `surfaceContainer` + borda fina de luz + brilho no topo.
 *
 * O fundo continua OPACO de propósito. Sobre o fundo chapado do app não há o
 * que desfocar, e deixar o card translúcido só o aproximaria da cor do fundo,
 * apagando a separação entre os dois. O que vende o vidro aqui é a borda e o
 * brilho — não a transparência. Ver `constants/glass.ts`.
 */
export function Card({
  level = 'raised',
  className,
  style,
  children,
  ...props
}: CardProps) {
  const colors = useThemeColors();
  const glass = useGlass();
  return (
    <View
      className={`rounded-card ${className ?? ''}`}
      style={[
        {
          backgroundColor: colors.surfaceContainer,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: glass.border,
        },
        level === 'raised' ? RAISED : null,
        style,
      ]}
      {...props}
    >
      {children}
      {/* Sobreposto e sem toque: não entra no fluxo, então não muda o layout
          de nenhum dos cards que já existem. */}
      <LinearGradient
        pointerEvents="none"
        colors={glass.sheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={[StyleSheet.absoluteFill, { borderRadius: CARD_RADIUS }]}
      />
    </View>
  );
}
