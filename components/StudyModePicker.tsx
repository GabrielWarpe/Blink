import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Deck } from '@/types';
import { deckSupportsQuiz } from '@/utils/practice';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Orquestra o play de um deck: se ele NÃO suporta quiz, navega direto para os
 * flashcards (sem perguntar); se suporta, abre o StudyModePicker. Cada tela
 * com botões de play instancia o seu:
 *
 *   const picker = useStudyModePicker();
 *   ... onPress={() => picker.requestPlay(deck)}
 *   <StudyModePicker deck={picker.pickerDeck} onClose={picker.close} />
 */
export function useStudyModePicker() {
  const router = useRouter();
  const [pickerDeck, setPickerDeck] = useState<Deck | null>(null);

  const requestPlay = (deck: Deck) => {
    if (!deckSupportsQuiz(deck)) {
      router.push(`/study/${deck.id}`);
      return;
    }
    setPickerDeck(deck);
  };

  return { pickerDeck, requestPlay, close: () => setPickerDeck(null) };
}

interface StudyModePickerProps {
  /** Deck alvo; `null` = fechado. */
  deck: Deck | null;
  onClose: () => void;
}

interface ModeOption {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}

/**
 * Bottom sheet de escolha do modo de estudo (2 passos): modos → intercalação
 * (só quando "Flashcards + quiz"). "Escrever" aparece como opção secundária.
 */
export function StudyModePicker({ deck, onClose }: StudyModePickerProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const [step, setStep] = useState<'mode' | 'mix'>('mode');

  // Sempre reabre no passo 1.
  useEffect(() => {
    setStep('mode');
  }, [deck]);

  if (!deck) return null;

  // Fecha ANTES de navegar, para o sheet não reaparecer ao voltar da sessão.
  const go = (
    pathname: '/study/[deckId]' | '/quiz/[deckId]' | '/write/[deckId]',
    params: Record<string, string> = {},
  ) => {
    onClose();
    router.push({ pathname, params: { deckId: deck.id, ...params } });
  };

  const modeOptions: ModeOption[] = [
    {
      icon: 'albums',
      title: 'Só flashcards',
      subtitle: 'Vire o card e avalie sua resposta',
      onPress: () => go('/study/[deckId]'),
    },
    {
      icon: 'help-circle',
      title: 'Só quiz',
      subtitle: 'Perguntas de múltipla escolha',
      onPress: () => go('/quiz/[deckId]'),
    },
    {
      icon: 'shuffle',
      title: 'Flashcards + quiz',
      subtitle: 'Os dois formatos intercalados',
      onPress: () => setStep('mix'),
    },
  ];

  const mixOptions: ModeOption[] = [
    {
      icon: 'swap-vertical',
      title: 'Alternado 1 a 1',
      subtitle: 'Um flashcard, um quiz, um flashcard…',
      onPress: () => go('/study/[deckId]', { mode: 'mixed', mix: 'alt' }),
    },
    {
      icon: 'dice',
      title: 'Aleatório 50/50',
      subtitle: 'Cada card sorteia seu formato',
      onPress: () => go('/study/[deckId]', { mode: 'mixed', mix: 'random' }),
    },
  ];

  const options = step === 'mode' ? modeOptions : mixOptions;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable
          className="bg-surface-container rounded-t-3xl overflow-hidden"
          onPress={e => e.stopPropagation()}
        >
          {/* Header */}
          <View className="px-5 py-4 border-b border-outline-variant/30 flex-row items-center gap-2">
            {step === 'mix' && (
              <TouchableOpacity
                onPress={() => setStep('mode')}
                hitSlop={10}
                className="pr-1"
              >
                <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
              </TouchableOpacity>
            )}
            <View className="flex-1">
              <Text className="text-on-surface font-jakarta-bold text-base">
                {step === 'mode' ? 'Como você quer estudar?' : 'Como intercalar?'}
              </Text>
              <Text
                className="text-on-surface-variant font-inter-regular text-sm mt-0.5"
                numberOfLines={1}
              >
                {deck.title}
              </Text>
            </View>
          </View>

          <View style={{ padding: 12 }}>
            {options.map(opt => (
              <Pressable
                key={opt.title}
                onPress={opt.onPress}
                className="flex-row items-center gap-3 rounded-button px-3 py-3"
              >
                <View
                  className="w-11 h-11 rounded-button items-center justify-center"
                  style={{ backgroundColor: colors.primary + '22' }}
                >
                  <Ionicons name={opt.icon} size={22} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-on-surface font-inter-semibold text-[15px]">
                    {opt.title}
                  </Text>
                  <Text className="text-outline font-inter-regular text-xs mt-0.5">
                    {opt.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.outline} />
              </Pressable>
            ))}

            {/* Escrever: opção secundária (substitui o antigo botão escola) */}
            {step === 'mode' && (
              <>
                <View className="h-px bg-outline-variant/30 mx-3 my-2" />
                <Pressable
                  onPress={() => go('/write/[deckId]')}
                  className="flex-row items-center gap-3 rounded-button px-3 py-2.5"
                >
                  <View
                    className="w-9 h-9 rounded-button items-center justify-center"
                    style={{ backgroundColor: colors.tertiary + '22' }}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.tertiary} />
                  </View>
                  <Text className="flex-1 text-on-surface-variant font-inter-medium text-sm">
                    Escrever a resposta
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.outline} />
                </Pressable>
              </>
            )}
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            className="py-4 items-center border-t border-outline-variant/30"
          >
            <Text className="text-on-surface-variant font-inter-medium text-sm">
              Cancelar
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
