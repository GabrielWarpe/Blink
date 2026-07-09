import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { cardShadow } from '@/components/ui/Card';
import type {
  DeckConflict,
  ConflictAction,
  ImportDeck,
} from '@/services/backup';

export interface ConflictResolution {
  deck: ImportDeck;
  existingId: string;
  action: ConflictAction;
}

interface Props {
  visible: boolean;
  conflicts: DeckConflict[];
  onCancel: () => void;
  onResolve: (resolutions: ConflictResolution[]) => void;
}

/**
 * Resolve conflitos de importação um por vez: cada baralho que já existe pode
 * ser importado como cópia, pulado ou substituir o atual (com confirmação).
 * Um toggle "aplicar a todos" repete a escolha nos conflitos restantes.
 */
export function ImportConflictModal({
  visible,
  conflicts,
  onCancel,
  onResolve,
}: Props) {
  const colors = useThemeColors();
  const [idx, setIdx] = useState(0);
  const [resolutions, setResolutions] = useState<ConflictResolution[]>([]);
  const [applyAll, setApplyAll] = useState(false);
  const [confirmingReplace, setConfirmingReplace] = useState(false);

  // Reinicia o estado a cada nova importação.
  useEffect(() => {
    if (visible) {
      setIdx(0);
      setResolutions([]);
      setApplyAll(false);
      setConfirmingReplace(false);
    }
  }, [visible]);

  const current = conflicts[idx];
  if (!current) return null;

  const total = conflicts.length;

  const choose = (action: ConflictAction) => {
    const remaining = conflicts.slice(idx);
    if (applyAll) {
      onResolve([
        ...resolutions,
        ...remaining.map(c => ({
          deck: c.deck,
          existingId: c.existingId,
          action,
        })),
      ]);
      return;
    }
    const next = [
      ...resolutions,
      { deck: current.deck, existingId: current.existingId, action },
    ];
    if (idx + 1 >= total) {
      onResolve(next);
    } else {
      setResolutions(next);
      setIdx(idx + 1);
      setConfirmingReplace(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View
          className="w-full bg-surface-container rounded-card p-5"
          style={cardShadow}
        >
          {confirmingReplace ? (
            <>
              <View
                className="w-12 h-12 rounded-button items-center justify-center mb-4"
                style={{ backgroundColor: colors.error + '22' }}
              >
                <Ionicons name="warning" size={24} color={colors.error} />
              </View>
              <Text className="text-on-surface font-jakarta-bold text-lg">
                Substituir "{current.existingTitle}"?
              </Text>
              <Text className="text-on-surface-variant font-inter-regular text-sm mt-2 leading-5">
                Isso apaga o baralho atual e todo o progresso dele
                {applyAll ? ' (e os demais em conflito)' : ''}. Esta ação não
                pode ser desfeita.
              </Text>
              <View className="gap-2 mt-5">
                <TouchableOpacity
                  onPress={() => choose('replace')}
                  activeOpacity={0.85}
                  className="bg-error rounded-button py-3.5 items-center"
                >
                  <Text className="text-white font-inter-semibold text-base">
                    Substituir
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setConfirmingReplace(false)}
                  activeOpacity={0.8}
                  className="py-3 items-center"
                >
                  <Text className="text-on-surface-variant font-inter-medium text-sm">
                    Voltar
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-outline font-inter-semibold text-xs tracking-widest">
                  BARALHO JÁ EXISTE
                </Text>
                {total > 1 && (
                  <Text className="text-outline font-inter-medium text-xs">
                    {idx + 1} de {total}
                  </Text>
                )}
              </View>
              <Text
                className="text-on-surface font-jakarta-bold text-xl"
                numberOfLines={2}
              >
                {current.existingTitle}
              </Text>
              <Text className="text-on-surface-variant font-inter-regular text-sm mt-1.5 leading-5">
                Você já tem um baralho com esse nome. O que deseja fazer com o
                importado?
              </Text>

              <View className="gap-2 mt-5">
                <ActionRow
                  icon="copy-outline"
                  color={colors.primary}
                  label="Importar como cópia"
                  hint="Cria um baralho novo, sem tocar no atual"
                  onPress={() => choose('copy')}
                />
                <ActionRow
                  icon="play-skip-forward-outline"
                  color={colors.onSurfaceVariant}
                  label="Pular"
                  hint="Não importa; mantém o que já existe"
                  onPress={() => choose('skip')}
                />
                <ActionRow
                  icon="swap-horizontal"
                  color={colors.error}
                  label="Substituir"
                  hint="Troca o atual pelo importado (apaga o progresso)"
                  onPress={() => setConfirmingReplace(true)}
                />
              </View>

              {total > 1 && (
                <TouchableOpacity
                  onPress={() => setApplyAll(v => !v)}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-2.5 mt-4 py-1"
                >
                  <View
                    className="w-5 h-5 rounded-md items-center justify-center"
                    style={{
                      backgroundColor: applyAll
                        ? colors.primary
                        : colors.surfaceContainerHighest,
                    }}
                  >
                    {applyAll && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.onPrimary}
                      />
                    )}
                  </View>
                  <Text className="text-on-surface-variant font-inter-medium text-sm">
                    Aplicar a todos os {total} conflitos
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onCancel}
                activeOpacity={0.8}
                className="py-3 items-center mt-1"
              >
                <Text className="text-outline font-inter-medium text-sm">
                  Cancelar importação
                </Text>
              </TouchableOpacity>
            </>
          )}
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
