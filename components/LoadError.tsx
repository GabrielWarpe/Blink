import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';

interface LoadErrorProps {
  /** Mensagem crua do erro. Aparece só em desenvolvimento. */
  message: string;
  onRetry: () => void;
}

/**
 * Tela de "não deu para carregar", com botão de tentar de novo.
 *
 * Existe porque lista vazia e consulta que falhou davam exatamente a MESMA
 * tela — "Nenhum deck ainda" tanto para quem não tem deck quanto para quem
 * está sem internet ou esbarrou no RLS. Sem distinguir os dois, o usuário
 * conclui que o app perdeu os dados dele.
 *
 * A mensagem técnica fica atrás de `__DEV__`: "sem conexão" resolve para quem
 * usa; `PGRST301` só ajuda quem depura.
 */
export function LoadError({ message, onRetry }: LoadErrorProps) {
  const colors = useThemeColors();

  return (
    <View className="items-center justify-center px-8 pt-24">
      <View
        className="w-16 h-16 rounded-card items-center justify-center mb-4"
        style={{ backgroundColor: colors.error + '22' }}
      >
        <Ionicons name="cloud-offline" size={28} color={colors.error} />
      </View>
      <Text className="text-on-surface font-jakarta-bold text-lg text-center">
        Não foi possível carregar
      </Text>
      <Text className="text-on-surface-variant font-inter-regular text-sm mt-2 text-center leading-5">
        Verifique sua conexão e tente de novo. Seus dados continuam salvos.
      </Text>
      {__DEV__ && (
        <Text className="text-outline font-inter-regular text-xs mt-3 text-center">
          {message}
        </Text>
      )}
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        accessibilityRole="button"
        className="mt-6 px-5 py-2.5 rounded-button bg-primary-container"
      >
        <Text className="text-on-primary-container font-inter-semibold text-sm">
          Tentar de novo
        </Text>
      </TouchableOpacity>
    </View>
  );
}
