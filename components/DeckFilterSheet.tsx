import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useGlass } from '@/hooks/useGlass';
import { androidBlurMethod } from '@/constants/glass';
import { GlassBackdrop } from '@/components/ui/GlassSurface';

export type DeckSort = 'recent' | 'alpha' | 'count';

export const DECK_SORTS: { key: DeckSort; label: string }[] = [
  { key: 'recent', label: 'Recentes' },
  { key: 'alpha', label: 'A–Z' },
  { key: 'count', label: 'Mais cards' },
];

interface DeckFilterSheetProps {
  visible: boolean;
  sort: DeckSort;
  onSortChange: (s: DeckSort) => void;
  /** Todas as tags em uso; vazio esconde a seção inteira. */
  tags: string[];
  activeTag: string | null;
  onTagChange: (t: string | null) => void;
  onClose: () => void;
}

/** Pílula de opção — mesma caixa para ordenação e tag, muda só o rótulo. */
function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`px-3.5 py-2 rounded-pill ${
        active ? 'bg-primary-container' : 'bg-surface-container-high'
      }`}
    >
      <Text
        className={`font-inter-medium text-xs ${
          active ? 'text-on-primary-container' : 'text-on-surface-variant'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Filtros da aba Decks em bottom sheet de vidro — ordenação + tag.
 *
 * Antes eram duas fileiras de chips permanentes no cabeçalho, que comiam
 * altura em toda rolagem mesmo sem ninguém filtrar. Aqui só aparecem quando
 * pedidos (ícone de filtro dentro da busca), e o ícone marca quando há filtro
 * ativo — o estado não fica escondido.
 *
 * Mesmo esqueleto de vidro do `StudyModePicker`: fundo desfocado + painel com
 * BlurView. Ver `constants/glass.ts`.
 */
export function DeckFilterSheet({
  visible,
  sort,
  onSortChange,
  tags,
  activeTag,
  onTagChange,
  onClose,
}: DeckFilterSheetProps) {
  const colors = useThemeColors();
  const glass = useGlass();

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" onPress={onClose}>
        <GlassBackdrop />
        <Pressable
          className="rounded-t-3xl overflow-hidden"
          style={{ backgroundColor: glass.tint, maxHeight: '75%' }}
          onPress={e => e.stopPropagation()}
        >
          <BlurView
            intensity={glass.blurIntensity}
            tint={glass.blurTint}
            experimentalBlurMethod={androidBlurMethod}
            style={StyleSheet.absoluteFill}
          />

          {/* Header */}
          <View className="px-5 py-4 border-b border-outline-variant/30 flex-row items-center">
            <Text className="flex-1 text-on-surface font-jakarta-bold text-base">
              Filtros
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 20, gap: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="gap-3">
              <Text className="text-on-surface-variant font-inter-semibold text-xs uppercase">
                Ordenar por
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {DECK_SORTS.map(s => (
                  <Chip
                    key={s.key}
                    label={s.label}
                    active={sort === s.key}
                    onPress={() => onSortChange(s.key)}
                  />
                ))}
              </View>
            </View>

            {tags.length > 0 && (
              <View className="gap-3">
                <Text className="text-on-surface-variant font-inter-semibold text-xs uppercase">
                  Tag
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <Chip
                    label="Todas"
                    active={activeTag === null}
                    onPress={() => onTagChange(null)}
                  />
                  {tags.map(tag => (
                    <Chip
                      key={tag}
                      label={`#${tag}`}
                      active={activeTag === tag}
                      onPress={() =>
                        onTagChange(activeTag === tag ? null : tag)
                      }
                    />
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
