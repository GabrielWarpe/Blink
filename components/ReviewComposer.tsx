import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ReviewComposerProps {
  title: string;
  /** Linha de contexto acima do campo (ex.: a avaliação sendo respondida). */
  context?: string | null;
  /** Estrelas — só na avaliação. Ausente = resposta do autor, sem nota. */
  stars?: number;
  onStarsChange?: (n: number) => void;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  submitLabel: string;
  submitting: boolean;
  canSubmit: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

/**
 * Caixa de escrita ancorada ao teclado.
 *
 * O formulário inline no fim da página não funcionava: o teclado cobria o campo
 * e rolar até ele não resolvia — quando o bloco está no fim do conteúdo, não há
 * o que rolar depois dele, então a rolagem chega ao fim ANTES de trazer o campo
 * para cima do teclado. Aqui o campo é colado no rodapé da tela e sobe com o
 * teclado; não há conta de rolagem nem dependência do tamanho da página.
 *
 * A altura vem do próprio evento do teclado, e não de um `KeyboardAvoidingView`:
 * no iOS a janela não é redimensionada, então a folha precisa da margem; no
 * Android a janela encolhe sozinha (`adjustResize`) e a margem seria contada
 * duas vezes. Renderize FORA do `KeyboardAvoidingView` da tela, senão os dois
 * ajustes se somam.
 */
export function ReviewComposer({
  title,
  context,
  stars,
  onStarsChange,
  value,
  onChangeText,
  placeholder,
  submitLabel,
  submitting,
  canSubmit,
  onClose,
  onSubmit,
}: ReviewComposerProps) {
  const colors = useThemeColors();
  const [keyboard, setKeyboard] = useState(0);

  useEffect(() => {
    // `will*` no iOS acompanha a animação do teclado (a folha sobe junto);
    // no Android só existem os `did*`.
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, e =>
      setKeyboard(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(hideEvent, () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <View
      className="justify-end"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: 'rgba(0,0,0,0.45)' },
      ]}
    >
      {/* Toque fora fecha (e o teclado vai junto, com o campo desmontado). */}
      <Pressable className="flex-1" onPress={onClose} />

      <View
        className="bg-surface-container-high rounded-t-3xl px-5 pt-4 pb-5 gap-3 border-t border-outline-variant/30"
        style={{ marginBottom: Platform.OS === 'ios' ? keyboard : 0 }}
      >
        <View className="flex-row items-center">
          <Text className="flex-1 text-on-surface font-jakarta-bold text-base">
            {title}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Ionicons name="close" size={22} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {context != null && context !== '' && (
          <View className="border-l-2 border-outline-variant pl-3">
            <Text
              className="text-outline font-inter-regular text-xs leading-4"
              numberOfLines={3}
            >
              {context}
            </Text>
          </View>
        )}

        {stars != null && onStarsChange != null && (
          <StarRating value={stars} size={30} onChange={onStarsChange} />
        )}

        <TextInput
          // Abre o teclado já com o campo à vista — é o ponto da tela.
          autoFocus
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.outline}
          multiline
          selectionColor={colors.primary}
          className="bg-surface-container rounded-button px-4 py-3 text-on-surface font-inter-regular text-sm border border-outline-variant"
          // Teto de altura: um comentário longo não pode empurrar o botão de
          // enviar para trás do teclado.
          style={{ minHeight: 72, maxHeight: 140, textAlignVertical: 'top' }}
        />

        <Button
          variant="primary"
          size="md"
          onPress={onSubmit}
          loading={submitting}
          disabled={!canSubmit}
        >
          {submitting ? 'Enviando...' : submitLabel}
        </Button>
      </View>
    </View>
  );
}
