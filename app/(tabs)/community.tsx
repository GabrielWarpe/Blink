import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listCommunityDecks, type CommunitySort } from '@/services/community';
import type { CommunityDeckRow } from '@/types/db';
import { DeckAvatar } from '@/components/DeckAvatar';
import { StarRating } from '@/components/StarRating';
import { FilterSheet, type SortOption } from '@/components/FilterSheet';
import {
  RevealSearchBar,
  useRevealSearch,
} from '@/components/RevealSearchBar';
import { cardShadow } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useGlassEdge, GlassSheen } from '@/components/ui/GlassSurface';

const TRENDING_CARD_WIDTH = 168;

const COMMUNITY_SORTS: readonly SortOption<CommunitySort>[] = [
  { key: 'top', label: 'Melhor avaliados' },
  { key: 'downloads', label: 'Mais baixados' },
  { key: 'recent', label: 'Recentes' },
];

/** Título da lista densa — segue a ordenação escolhida. */
const LIST_TITLE: Record<CommunitySort, string> = {
  top: 'Mais bem avaliados',
  downloads: 'Mais baixados',
  recent: 'Publicados recentemente',
};

export default function CommunityScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const edge = useGlassEdge();
  const tabBar = useTabBarInset();
  const tabScroll = useTabBarScroll();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<CommunitySort>('top');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [decks, setDecks] = useState<CommunityDeckRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca revelada ao puxar — mesma da aba Decks (ver `RevealSearchBar`). O
  // `useTabBarScroll` também precisa do evento, então os dois são compostos
  // aqui em vez de disputar o `onScroll`.
  const reveal = useRevealSearch(search);
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    tabScroll.onScroll(e);
    reveal.onScroll(e);
  };

  // A ordenação é do servidor; "Em alta" reordena por downloads no cliente,
  // porque é uma vitrine fixa e não deve mudar com o filtro da lista.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDecks(await listCommunityDecks({ search, sort }));
    } finally {
      setLoading(false);
    }
  }, [search, sort]);

  // Recarrega ao focar (ex.: voltar de baixar/avaliar).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Busca com pequeno debounce para não consultar a cada tecla.
  useEffect(() => {
    const t = setTimeout(() => void load(), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  // Categorias: TODAS as tags dos decks carregados, em ordem ALFABÉTICA
  // estável (localeCompare 'pt' lida com acento/caixa) — mesma convenção da
  // aba Decks. Ordem fixa em vez de por frequência: um chip nunca troca de
  // posição ao adicionar/remover a tag de um deck, e nenhuma tag rara fica de
  // fora (sem chip = deck inalcançável no filtro). A linha rola na horizontal,
  // então lista longa não custa layout.
  // Nota: as tags vêm só dos decks já carregados — o listCommunityDecks traz
  // no máximo ~100 linhas; quando a comunidade crescer, vale paginar/derivar
  // as categorias no servidor.
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const d of decks) for (const tag of d.tags) set.add(tag);
    return [...set].sort((a, b) => a.localeCompare(b, 'pt'));
  }, [decks]);
  // Se a categoria ativa saiu da lista (nova busca mudou os decks), volta a
  // "Todos" em vez de filtrar por algo que não existe mais.
  const effectiveCategory =
    category !== null && categories.includes(category) ? category : null;

  const filtered =
    effectiveCategory === null
      ? decks
      : decks.filter(d =>
          d.tags.some(t => t.toLowerCase() === effectiveCategory.toLowerCase()),
        );

  /** Há filtro valendo? Marca o ícone da busca — o estado não fica escondido. */
  const hasFilter = effectiveCategory !== null || sort !== 'top';

  const trending = [...filtered]
    .sort((a, b) => b.downloads_count - a.downloads_count)
    .slice(0, 10);
  // Ordenando por nota, deck sem nenhuma avaliação não tem por que aparecer
  // numa lista de "mais bem avaliados"; nas outras ordens, entra tudo.
  const listed =
    sort === 'top' ? filtered.filter(d => d.rating_count > 0) : filtered;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      {loading && decks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        // Página inteira num só ScrollView: cabeçalho, busca e chips rolam
        // JUNTO com o conteúdo (não ficam fixos), então nada de "tela cortada
        // em duas" — ao descer, os chips somem naturalmente.
        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={tabScroll.scrollEventThrottle}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: tabBar.contentInset }}
        >
          {/* Header — título à esquerda, publicar à direita (padrão das abas) */}
          <View className="px-5 pt-6 pb-4 flex-row items-center justify-between">
            <Text
              className="text-on-surface font-jakarta-extrabold text-3xl"
              style={{ letterSpacing: -0.5 }}
            >
              Comunidade
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/community/publish' as Href)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Publicar um deck na comunidade"
              className="w-10 h-10 items-center justify-center rounded-button bg-surface-container"
              style={cardShadow}
            >
              <Ionicons name="add" size={22} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Busca revelada ao puxar — idêntica à da aba Decks */}
          <View className="px-5">
            <RevealSearchBar
              search={reveal}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar concurso, matéria, tema..."
              onOpenFilters={() => setFiltersOpen(true)}
              hasFilter={hasFilter}
            />
          </View>

          {/* Categorias — filtro primário. Os chips ficam num <View flex-row>
              INTERNO (não como filhos diretos do contentContainer): um
              ScrollView horizontal estica os filhos diretos na vertical, o que
              virava cápsulas altas ao selecionar. */}
          {categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => setCategory(null)}
                  activeOpacity={0.8}
                  className={`px-3.5 py-1.5 rounded-pill ${
                    effectiveCategory === null
                      ? 'bg-primary-container'
                      : 'bg-surface-container'
                  }`}
                >
                  <Text
                    className={`font-inter-semibold text-xs ${
                      effectiveCategory === null
                        ? 'text-on-primary-container'
                        : 'text-outline'
                    }`}
                  >
                    Todos
                  </Text>
                </TouchableOpacity>
                {categories.map(tag => {
                  const active = effectiveCategory === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => setCategory(active ? null : tag)}
                      activeOpacity={0.8}
                      className={`px-3.5 py-1.5 rounded-pill ${
                        active ? 'bg-primary-container' : 'bg-surface-container'
                      }`}
                    >
                      <Text
                        className={`font-inter-semibold text-xs ${
                          active ? 'text-on-primary-container' : 'text-outline'
                        }`}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {filtered.length === 0 ? (
            <View className="items-center justify-center px-8 pt-24">
              <View
                className="w-16 h-16 rounded-card items-center justify-center mb-4"
                style={{ backgroundColor: colors.primary + '22' }}
              >
                <Ionicons name="earth" size={28} color={colors.primary} />
              </View>
              <Text className="text-on-surface font-jakarta-bold text-lg text-center">
                {search || effectiveCategory ? 'Nada encontrado' : 'Ainda não há decks públicos'}
              </Text>
              <Text className="text-outline font-inter-regular text-sm text-center mt-2">
                {search || effectiveCategory
                  ? 'Tente outra busca ou categoria.'
                  : 'Seja o primeiro: toque em + para publicar um deck seu.'}
              </Text>
            </View>
          ) : (
            <>
          {/* Em alta esta semana — vitrine com capas grandes. Sem dado de
              popularidade por janela de tempo no banco: usa downloads
              acumulados como aproximação (é o sinal de "alta" que existe). */}
          {trending.length > 0 && (
            <View className="mt-5">
              <View className="flex-row items-center gap-1.5 px-5 mb-3">
                <Text className="text-on-surface font-jakarta-bold text-lg">
                  Em alta esta semana
                </Text>
                <Ionicons name="flame" size={16} color={colors.tertiary} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
              >
                {trending.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/community/${item.id}` as Href)}
                    style={{ width: TRENDING_CARD_WIDTH }}
                  >
                    <DeckAvatar
                      coverUrl={item.cover_url}
                      size={TRENDING_CARD_WIDTH}
                      radius={16}
                    />
                    <Text
                      className="text-on-surface font-jakarta-bold text-sm mt-2 leading-5"
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <StarRating value={item.rating_avg} size={12} />
                      <Text className="text-outline font-inter-medium text-xs">
                        {item.rating_avg.toFixed(1)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Ionicons
                        name="download-outline"
                        size={12}
                        color={colors.outline}
                      />
                      <Text className="text-outline font-inter-medium text-xs">
                        {item.downloads_count}
                      </Text>
                      <Text className="text-outline font-inter-regular text-xs">
                        · {item.card_count} cards
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Lista densa (ordem escolhida no filtro), sem competir por espaço
              com as capas grandes da vitrine acima. */}
          {listed.length > 0 && (
            <View className="mt-6 px-5">
              <Text className="text-on-surface font-jakarta-bold text-lg mb-3">
                {LIST_TITLE[sort]}
              </Text>
              <View className="gap-3">
                {listed.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/community/${item.id}` as Href)}
                    className="bg-surface-container rounded-card p-3 flex-row items-center gap-3"
                    style={[cardShadow, edge]}
                  >
                    <GlassSheen />
                    <DeckAvatar coverUrl={item.cover_url} size={48} radius={12} />
                    <View className="flex-1">
                      <Text
                        className="text-on-surface font-jakarta-bold text-sm"
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {item.author_name != null && (
                        <Text
                          className="text-outline font-inter-regular text-xs mt-0.5"
                          numberOfLines={1}
                        >
                          por {item.author_name}
                        </Text>
                      )}
                    </View>
                    <View className="items-end">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="star" size={12} color={colors.tertiary} />
                        <Text className="text-on-surface font-inter-semibold text-xs">
                          {item.rating_avg.toFixed(1)}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <Ionicons
                          name="download-outline"
                          size={11}
                          color={colors.outline}
                        />
                        <Text className="text-outline font-inter-medium text-xs">
                          {item.downloads_count}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
            </>
          )}
        </ScrollView>
      )}

      {/* Ordenação — aberta pelo ícone dentro da busca. As categorias já têm a
          linha de chips própria, então aqui só entra a ordem. */}
      <FilterSheet
        visible={filtersOpen}
        sorts={COMMUNITY_SORTS}
        sort={sort}
        onSortChange={setSort}
        onClose={() => setFiltersOpen(false)}
      />
    </SafeAreaView>
  );
}
