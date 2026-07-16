import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';

interface PublishToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
}

/**
 * Interruptor "Publicar na comunidade". Ligado, o deck vira um snapshot
 * público (capa, nome, descrição e cards) que qualquer usuário pode achar e
 * baixar. Editar o deck e salvar de novo atualiza o que está publicado.
 */
export function PublishToggle({ value, onValueChange }: PublishToggleProps) {
  const colors = useThemeColors();
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-3">
        <View
          className="w-10 h-10 rounded-button items-center justify-center"
          style={{ backgroundColor: colors.primary + '22' }}
        >
          <Ionicons name="earth" size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-on-surface font-inter-semibold text-[15px]">
            Publicar na comunidade
          </Text>
          <Text className="text-outline font-inter-regular text-xs mt-0.5 leading-4">
            Outros usuários poderão encontrar e baixar este deck.
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.surfaceContainerHighest, true: colors.primary }}
          thumbColor="#ffffff"
        />
      </View>
      {value && (
        <Text className="text-outline font-inter-regular text-xs leading-4">
          Publique apenas conteúdo seu ou de uso livre. Você pode despublicar a
          qualquer momento desligando esta opção.
        </Text>
      )}
    </View>
  );
}
