import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useGlass } from '@/hooks/useGlass';
import { GlassBackdrop, AnimatedGlassFill, GlassSpecular } from '@/components/ui/GlassSurface';

export interface SortOption<T extends string> {
  key: T;
  label: string;
}

interface FilterSheetProps<T extends string> {
  visible: boolean;
  /** Ordenações da tela — cada aba define as suas. */
  sorts: readonly SortOption<T>[];
  sort: T;
  onSortChange: (s: T) => void;
  /** Tags/categorias em uso; vazio esconde a seção inteira. */
  tags?: string[];
  activeTag?: string | null;
  onTagChange?: (t: string | null) => void;
  /** Rótulo da seção de tags ("Tag" nos decks, "Categoria" na comunidade). */
  tagLabel?: string;
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
 * Filtros de uma aba em bottom sheet de vidro — ordenação + tag opcional.
 *
 * Antes eram fileiras de chips permanentes no cabeçalho, que comiam altura em
 * toda rolagem mesmo sem ninguém filtrar. Aqui só aparecem quando pedidos
 * (ícone de filtro dentro da busca), e o ícone marca quando há filtro ativo —
 * o estado não fica escondido.
 *
 * Mesmo esqueleto de vidro do `StudyModePicker`: fundo desfocado + painel com
 * BlurView. Ver `constants/glass.ts`.
 */
export function FilterSheet<T extends string>({
  visible,
  sorts,
  sort,
  onSortChange,
  tags = [],
  activeTag = null,
  onTagChange,
  tagLabel = 'Tag',
  onClose,
}: FilterSheetProps<T>) {
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
          <AnimatedGlassFill />

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
                {sorts.map(s => (
                  <Chip
                    key={s.key}
                    label={s.label}
                    active={sort === s.key}
                    onPress={() => onSortChange(s.key)}
                  />
                ))}
              </View>
            </View>

            {tags.length > 0 && onTagChange != null && (
              <View className="gap-3">
                <Text className="text-on-surface-variant font-inter-semibold text-xs uppercase">
                  {tagLabel}
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

          {/* Último filho: a luz varre POR CIMA do conteúdo. */}
          <GlassSpecular />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
