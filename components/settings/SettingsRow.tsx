import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Toggle } from '@/components/ui/Toggle';
import { useThemeColors } from '@/hooks/useThemeColors';

interface SettingsRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  title: string;
  subtitle?: string;
  /** Texto à direita (valor atual de um seletor). */
  value?: string;
  onPress?: () => void;
  /** Toggle nativo à direita. */
  toggle?: { value: boolean; onValueChange: (v: boolean) => void };
  /** Conteúdo customizado à direita (ex.: input inline). */
  rightSlot?: React.ReactNode;
  destructive?: boolean;
}

export function SettingsRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onPress,
  toggle,
  rightSlot,
  destructive = false,
}: SettingsRowProps) {
  const colors = useThemeColors();
  // Sem `iconColor`, o ícone segue o texto do tema (monocromático). O default
  // era um teal cravado — sobra da identidade antiga.
  const color = destructive ? colors.error : (iconColor ?? colors.onSurface);
  const pressable = onPress != null && toggle == null && rightSlot == null;

  const inner = (
    <>
      <View
        className="w-8 h-8 rounded-lg items-center justify-center"
        style={{ backgroundColor: color + '22' }}
      >
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <View className="flex-1">
        <Text
          className={`font-inter-medium text-[15px] ${
            destructive ? 'text-error' : 'text-on-surface'
          }`}
        >
          {title}
        </Text>
        {subtitle != null && (
          <Text className="text-outline font-inter-regular text-xs mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>

      {rightSlot != null ? (
        rightSlot
      ) : toggle != null ? (
        <Toggle value={toggle.value} onValueChange={toggle.onValueChange} />
      ) : (
        <View className="flex-row items-center gap-1.5">
          {value != null && (
            <Text className="text-outline font-inter-regular text-sm">
              {value}
            </Text>
          )}
          {onPress != null && (
            <Ionicons name="chevron-forward" size={16} color={colors.outline} />
          )}
        </View>
      )}
    </>
  );

  if (pressable) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center gap-3 px-4 py-3"
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <View className="flex-row items-center gap-3 px-4 py-3">{inner}</View>
  );
}
