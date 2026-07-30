import React, { useRef, useState } from 'react';
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
import { cardShadow } from '@/components/ui/Card';
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
 * **O puxão sozinho não basta.** Ele depende de `contentOffset.y` NEGATIVO, que
 * só existe com o `bounces` do iOS; o Android grampeia o offset em 0 e desenha
 * o brilho de overscroll no lugar. Lá a condição do puxão nunca é verdadeira e
 * a busca ficaria inalcançável — por isso o `SearchToggleButton` do cabeçalho é
 * o caminho garantido nas duas plataformas, e o puxão vira atalho no iOS.
 *
 * O `onScroll` devolvido é um handler comum: componha com o da barra de abas
 * em vez de disputar a prop.
 *
 *     const search = useRevealSearch(query, () => setQuery(''));
 *     <ScrollView onScroll={e => { tabScroll.onScroll(e); search.onScroll(e); }}>
 *       <RevealSearchBar search={search} value={query} … />
 *
 * @param onClear Limpa o texto ao fechar pelo botão — fechar com filtro valendo
 *   esconderia a razão de a lista estar curta.
 */
export function useRevealSearch(query: string, onClear?: () => void) {
  const height = useSharedValue(0);
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const toggle = (next: boolean) => {
    if (openRef.current === next) return;
    openRef.current = next;
    setOpen(next);
    height.value = withTiming(next ? SEARCH_HEIGHT : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    if (!next) inputRef.current?.blur();
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y < -PULL_TO_REVEAL) toggle(true);
    else if (y > SCROLL_TO_HIDE && query.length === 0) toggle(false);
  };

  /**
   * Abre/fecha pelo botão do cabeçalho. Abrir foca o campo direto — quem toca
   * na lupa quer digitar, não olhar um campo vazio.
   */
  const toggleOpen = () => {
    if (openRef.current) {
      onClear?.();
      toggle(false);
    } else {
      toggle(true);
      inputRef.current?.focus();
    }
  };

  const style = useAnimatedStyle(() => ({
    height: height.value,
    opacity: interpolate(height.value, [0, SEARCH_HEIGHT], [0, 1]),
  }));

  return { style, inputRef, onScroll, open, toggleOpen };
}

interface SearchToggleButtonProps {
  search: ReturnType<typeof useRevealSearch>;
  /** Há filtro/busca valendo? Marca o botão para o estado não ficar escondido. */
  active?: boolean;
}

/**
 * Botão de lupa do cabeçalho — mesmo formato dos outros botões de ação das
 * abas (40×40, `bg-surface-container`, `cardShadow`).
 */
export function SearchToggleButton({ search, active }: SearchToggleButtonProps) {
  const colors = useThemeColors();
  const isOpen = search.open;

  return (
    <TouchableOpacity
      onPress={search.toggleOpen}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={isOpen ? 'Fechar busca' : 'Buscar'}
      accessibilityState={{ expanded: isOpen }}
      className="w-10 h-10 items-center justify-center rounded-button bg-surface-container"
      style={cardShadow}
    >
      <Ionicons
        name={isOpen ? 'close' : 'search'}
        size={20}
        color={active && !isOpen ? colors.primary : colors.onSurface}
      />
    </TouchableOpacity>
  );
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
