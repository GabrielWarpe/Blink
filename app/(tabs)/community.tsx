import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  listCommunityDecks,
  type CommunitySort,
} from '@/services/community';
import type { CommunityDeckRow } from '@/types/db';
import { DeckAvatar } from '@/components/DeckAvatar';
import { StarRating } from '@/components/StarRating';
import { Input } from '@/components/ui/Input';
import { cardShadow } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useThemeColors';
import { TAB_SCREEN_BOTTOM_INSET } from '@/constants/layout';

const SORTS: { key: CommunitySort; label: string }[] = [
  { key: 'top', label: 'Melhores' },
  { key: 'downloads', label: 'Mais baixados' },
  { key: 'recent', label: 'Recentes' },
];

export default function CommunityScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<CommunitySort>('top');
  const [decks, setDecks] = useState<CommunityDeckRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDecks(await listCommunityDecks({ search, sort }));
    } finally {
      setLoading(false);
    }
  }, [search, sort]);

  // Recarrega ao focar (ex.: voltar de baixar/avaliar) e quando muda a ordenação.
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-5 pt-6 pb-3">
        <Text
          className="text-on-surface font-jakarta-extrabold text-3xl mb-1"
          style={{ letterSpacing: -0.5 }}
        >
          Comunidade
        </Text>
        <Text className="text-on-surface-variant font-inter-regular text-sm">
          Decks prontos, feitos por outros estudantes.
        </Text>
      </View>

      {/* Busca */}
      <View className="px-5">
        <Input
          placeholder="Buscar por concurso, matéria, tema..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Ordenação */}
      <View className="flex-row gap-2 px-5 mt-3 mb-1">
        {SORTS.map(s => {
          const active = sort === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              onPress={() => setSort(s.key)}
              className={`px-3 py-1.5 rounded-pill ${
                active ? 'bg-primary-container' : 'bg-surface-container'
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`font-inter-semibold text-xs ${
                  active ? 'text-on-primary-container' : 'text-outline'
                }`}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && decks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={d => d.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: TAB_SCREEN_BOTTOM_INSET,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center px-8 pt-24">
              <View
                className="w-16 h-16 rounded-card items-center justify-center mb-4"
                style={{ backgroundColor: colors.primary + '22' }}
              >
                <Ionicons name="earth" size={28} color={colors.primary} />
              </View>
              <Text className="text-on-surface font-jakarta-bold text-lg text-center">
                {search ? 'Nada encontrado' : 'Ainda não há decks públicos'}
              </Text>
              <Text className="text-outline font-inter-regular text-sm text-center mt-2">
                {search
                  ? 'Tente outra busca.'
                  : 'Seja o primeiro: publique um deck na edição dele.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push(`/community/${item.id}` as Href)
              }
              className="bg-surface-container rounded-card p-4 flex-row gap-3"
              style={cardShadow}
            >
              <DeckAvatar coverUrl={item.cover_url} size={56} radius={14} />
              <View className="flex-1">
                <Text
                  className="text-on-surface font-jakarta-bold text-base"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {item.description ? (
                  <Text
                    className="text-outline font-inter-regular text-xs mt-0.5 leading-4"
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                ) : null}
                <View className="flex-row items-center gap-2 mt-2">
                  <StarRating value={item.rating_avg} size={13} />
                  <Text className="text-outline font-inter-medium text-xs">
                    {item.rating_count > 0
                      ? `${item.rating_avg.toFixed(1)} (${item.rating_count})`
                      : 'sem notas'}
                  </Text>
                  <Text className="text-outline font-inter-regular text-xs">•</Text>
                  <Ionicons
                    name="download-outline"
                    size={13}
                    color={colors.outline}
                  />
                  <Text className="text-outline font-inter-medium text-xs">
                    {item.downloads_count}
                  </Text>
                  <Text className="text-outline font-inter-regular text-xs">•</Text>
                  <Text
                    className="text-outline font-inter-regular text-xs flex-1"
                    numberOfLines={1}
                  >
                    {item.card_count} cards
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
