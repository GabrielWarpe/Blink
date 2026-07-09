import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MAX_QUIZ_OPTIONS } from '@/utils/practice';
import { Input } from '@/components/ui/Input';
import { useThemeColors } from '@/hooks/useThemeColors';

interface QuizOptionsInputProps {
  /** Alternativas ERRADAS (até 3); a correta é sempre o verso do card. */
  options: string[];
  onChange: (options: string[]) => void;
}

/** Quantas alternativas não vazias foram preenchidas. */
export function filledQuizOptions(options: string[]): string[] {
  return options.map(o => o.trim()).filter(o => o.length > 0);
}

/**
 * Seção opcional "Quiz" dos formulários de card: 3 campos de alternativas
 * erradas. Com 2+ preenchidas o card vira pergunta de quiz; vazio = card
 * segue só como flashcard. Colapsada por padrão para não pesar o formulário.
 */
export function QuizOptionsInput({ options, onChange }: QuizOptionsInputProps) {
  const colors = useThemeColors();
  const filled = filledQuizOptions(options);
  const [open, setOpen] = useState(filled.length > 0);

  const setAt = (index: number, value: string) => {
    const next = Array.from(
      { length: MAX_QUIZ_OPTIONS },
      (_, i) => (i === index ? value : (options[i] ?? '')),
    );
    onChange(next);
  };

  return (
    <View className="gap-2">
      <Pressable
        onPress={() => setOpen(o => !o)}
        className="flex-row items-center gap-2"
      >
        <Ionicons name="help-circle" size={18} color={colors.primary} />
        <Text className="flex-1 text-on-surface-variant font-inter-medium text-sm">
          Quiz (opcional)
          {filled.length > 0 ? ` · ${filled.length + 1} opções` : ''}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.outline}
        />
      </Pressable>

      {open && (
        <View className="gap-3">
          <Text className="text-outline font-inter-regular text-xs leading-4">
            Escreva 2 ou 3 alternativas ERRADAS que combinem com a pergunta —
            a correta é o verso do card. Com 2+ preenchidas, este card também
            vira uma pergunta de quiz.
          </Text>
          {Array.from({ length: MAX_QUIZ_OPTIONS }, (_, i) => (
            <Input
              key={i}
              placeholder={`Alternativa errada ${i + 1}${i === 2 ? ' (opcional)' : ''}`}
              value={options[i] ?? ''}
              onChangeText={v => setAt(i, v)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
