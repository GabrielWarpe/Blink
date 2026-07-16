import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';

interface StarRatingProps {
  /** Nota de 0 a 5 (aceita frações para exibição — arredonda ao meio). */
  value: number;
  size?: number;
  /** Quando presente, as estrelas viram tocáveis (input de nota). */
  onChange?: (stars: number) => void;
}

/**
 * Estrelas de avaliação. Sem `onChange` é só leitura (média do deck, com
 * meia-estrela); com `onChange` vira seletor de 1 a 5.
 */
export function StarRating({ value, size = 16, onChange }: StarRatingProps) {
  const colors = useThemeColors();
  const editable = onChange != null;

  return (
    <View className="flex-row" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => {
        const name: React.ComponentProps<typeof Ionicons>['name'] = editable
          ? i <= value
            ? 'star'
            : 'star-outline'
          : value >= i
            ? 'star'
            : value >= i - 0.5
              ? 'star-half'
              : 'star-outline';
        const star = (
          <Ionicons
            name={name}
            size={size}
            color={value >= i - 0.5 || (editable && i <= value) ? colors.tertiary : colors.outline}
          />
        );
        return editable ? (
          <TouchableOpacity
            key={i}
            onPress={() => onChange(i)}
            hitSlop={6}
            activeOpacity={0.7}
          >
            {star}
          </TouchableOpacity>
        ) : (
          <View key={i}>{star}</View>
        );
      })}
    </View>
  );
}
