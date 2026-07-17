import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

/** Chip tingido (mesmo padrão do resto do app) — sem emoji, ícone Ionicons. */
export function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const colors = useThemeColors();
  const config = {
    sm: { container: 'px-2 py-1 gap-1', icon: 14, text: 'text-xs' },
    md: { container: 'px-3 py-1.5 gap-1.5', icon: 16, text: 'text-sm' },
    lg: { container: 'px-4 py-2 gap-2', icon: 20, text: 'text-base' },
  }[size];

  return (
    <View
      className={`flex-row items-center bg-tertiary/15 rounded-pill ${config.container}`}
    >
      <Ionicons name="flame" size={config.icon} color={colors.tertiary} />
      <Text className={`text-tertiary font-jakarta-bold ${config.text}`}>
        {streak} {streak === 1 ? 'dia' : 'dias'}
      </Text>
    </View>
  );
}
