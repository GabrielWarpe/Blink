import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { cardShadow } from '@/components/ui/Card';

interface Props {
  /** Nº de questões sem resposta; `null` = não perguntar nada. */
  pendingFinish: number | null;
  /** "Refazer questões": nova rodada só com as que faltam. */
  onRedo: () => void;
  /** "Deixar sem resposta": elas viram Puladas e vai para o resultado. */
  onLeave: () => void;
}

/**
 * Perguntado ao finalizar uma sessão com questões sem resposta. Substitui o
 * `Alert.alert` nativo: era a única decisão do fluxo de estudo fora do design
 * system (mesmos tokens e estrutura do ImportConflictModal).
 *
 * Não é dispensável por fora — o usuário precisa escolher, como no alerta
 * original (`cancelable: false`).
 */
export function FinishPromptModal({ pendingFinish, onRedo, onLeave }: Props) {
  const colors = useThemeColors();
  const count = pendingFinish;
  if (count == null) return null;

  const plural = count === 1 ? 'questão' : 'questões';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View
          className="w-full bg-surface-container rounded-card p-5"
          style={cardShadow}
        >
          <View
            className="w-12 h-12 rounded-button items-center justify-center mb-4"
            style={{ backgroundColor: colors.tertiary + '22' }}
          >
            <Ionicons name="alert-circle" size={24} color={colors.tertiary} />
          </View>

          <Text className="text-on-surface font-jakarta-bold text-lg">
            {count} {plural} sem resposta
          </Text>
          <Text className="text-on-surface-variant font-inter-regular text-sm mt-2 leading-5">
            Você chegou ao fim da sessão sem responder {count === 1 ? 'a' : 'as'}{' '}
            {count === 1 ? '' : `${count} `}
            {plural}. O que deseja fazer?
          </Text>

          <View className="gap-2 mt-5">
            <ActionRow
              icon="refresh"
              color={colors.primary}
              label="Refazer questões"
              hint={`Nova rodada só com ${count === 1 ? 'ela' : 'elas'}`}
              onPress={onRedo}
            />
            <ActionRow
              icon="play-skip-forward-outline"
              color={colors.onSurfaceVariant}
              label="Deixar sem resposta"
              hint={`${count === 1 ? 'Conta' : 'Contam'} como ${
                count === 1 ? 'Pulada' : 'Puladas'
              } no resultado`}
              onPress={onLeave}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ActionRow({
  icon,
  color,
  label,
  hint,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 bg-surface-container-high rounded-button px-3.5 py-3"
    >
      <View
        className="w-9 h-9 rounded-button items-center justify-center"
        style={{ backgroundColor: color + '22' }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-on-surface font-inter-semibold text-[15px]">
          {label}
        </Text>
        <Text className="text-outline font-inter-regular text-xs mt-0.5">
          {hint}
        </Text>
      </View>
    </Pressable>
  );
}
