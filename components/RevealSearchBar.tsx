import React, { useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';

/** Altura da barra de busca quando revelada. */
export const SEARCH_HEIGHT = 56;
/** Quanto puxar além do topo para revelar a busca. */
const PULL_TO_REVEAL = 40;
/** A partir daqui a busca se esconde de novo (só se estiver vazia). */
const SCROLL_TO_HIDE = 60;

/**
 * Busca revelada ao puxar (padrão iOS: Mail/Mensagens). Fica escondida por
 * padrão para não comer altura em toda rolagem; puxar o conteúdo além do topo
 * revela e rolar para dentro esconde de novo — mas NUNCA enquanto houver texto
 * digitado, senão o filtro sumiria da vista ainda valendo.
 *
 * O `onScroll` devolvido é um handler comum: componha com o da barra de abas
 * em vez de disputar a prop.
 *
 *     const search = useRevealSearch(query);
 *     <ScrollView onScroll={e => { tabScroll.onScroll(e); search.onScroll(e); }}>
 *       <RevealSearchBar search={search} value={query} … />
 */
export function useRevealSearch(query: string) {
  const height = useSharedValue(0);
  const openRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  const toggle = (open: boolean) => {
    if (openRef.current === open) return;
    openRef.current = open;
    height.value = withTiming(open ? SEARCH_HEIGHT : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    if (!open) inputRef.current?.blur();
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y < -PULL_TO_REVEAL) toggle(true);
    else if (y > SCROLL_TO_HIDE && query.length === 0) toggle(false);
  };

  const style = useAnimatedStyle(() => ({
    height: height.value,
    opacity: interpolate(height.value, [0, SEARCH_HEIGHT], [0, 1]),
  }));

  return { style, inputRef, onScroll };
}

interface RevealSearchBarProps {
  /** O que `useRevealSearch` devolveu — altura animada + ref do campo. */
  search: ReturnType<typeof useRevealSearch>;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onOpenFilters: () => void;
  /** Há filtro valendo? Marca o ícone para o estado não ficar escondido. */
  hasFilter: boolean;
}

export function RevealSearchBar({
  search,
  value,
  onChangeText,
  placeholder,
  onOpenFilters,
  hasFilter,
}: RevealSearchBarProps) {
  const colors = useThemeColors();

  return (
    <Animated.View style={[{ overflow: 'hidden' }, search.style]}>
      <View
        className="flex-row items-center bg-surface-container-high rounded-button px-3.5 border border-outline-variant"
        style={{ height: SEARCH_HEIGHT - 12, marginBottom: 12 }}
      >
        <Ionicons name="search" size={18} color={colors.outline} />
        <TextInput
          ref={search.inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.outline}
          className="flex-1 px-2 text-on-surface font-inter-regular text-base"
          selectionColor={colors.primary}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={onOpenFilters} hitSlop={10} activeOpacity={0.7}>
          <Ionicons
            name="options-outline"
            size={20}
            color={hasFilter ? colors.primary : colors.outline}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
