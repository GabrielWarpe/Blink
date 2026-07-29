import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDecks } from '@/hooks/useDecks';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import {
  exportDeck,
  exportDecks,
  pickBackupFile,
  parseBackup,
  buildImportPlan,
  applyDeckImport,
  applyCardImport,
  BackupError,
  type ImportDeck,
  type DeckConflict,
  type ImportCard,
  type CardImportTarget,
} from '@/services/backup';
import { errorMessage } from '@/utils/errors';
import { canExport } from '@/utils/community';
import { DeckCard } from '@/components/DeckCard';
import { SwipeableDeckRow } from '@/components/SwipeableDeckRow';
import {
  StudyModePicker,
  useStudyModePicker,
} from '@/components/StudyModePicker';
import { cardShadow } from '@/components/ui/Card';
import { FilterSheet, type SortOption } from '@/components/FilterSheet';
import {
  RevealSearchBar,
  useRevealSearch,
} from '@/components/RevealSearchBar';
import {
  ImportConflictModal,
  type ConflictResolution,
} from '@/components/ImportConflictModal';
import { DeckPickerModal } from '@/components/DeckPickerModal';

type DeckSort = 'recent' | 'alpha' | 'count';

const DECK_SORTS: readonly SortOption<DeckSort>[] = [
  { key: 'recent', label: 'Recentes' },
  { key: 'alpha', label: 'A–Z' },
  { key: 'count', label: 'Mais cards' },
];

export default function DecksScreen() {
  const router = useRouter();
  const picker = useStudyModePicker();
  const { user } = useAuth();
  const { decks, reload, deleteDeck } = useDecks();
  const colors = useThemeColors();
  const tabBar = useTabBarInset();
  const tabScroll = useTabBarScroll();
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [sort, setSort] = useState<DeckSort>('recent');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const reveal = useRevealSearch(search);

  // O `useTabBarScroll` também precisa deste evento (encolhe a barra de abas),
  // então os dois são compostos aqui em vez de disputar o `onScroll`.
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    tabScroll.onScroll(e);
    reveal.onScroll(e);
  };

  // Estado dos modais de importação.
  const [conflictState, setConflictState] = useState<{
    newDecks: ImportDeck[];
    conflicts: DeckConflict[];
  } | null>(null);
  const [cardState, setCardState] = useState<{
    cards: ImportCard[];
    source: { title: string; emoji: string } | null;
  } | null>(null);

  // Todas as tags em uso, para a linha de filtro. Se a tag ativa deixou de
  // existir (deck editado/excluído), o filtro volta para "Todas".
  const allTags = [...new Set(decks.flatMap(d => d.tags))].sort((a, b) =>
    a.localeCompare(b, 'pt'),
  );
  const effectiveTag =
    activeTag !== null && allTags.includes(activeTag) ? activeTag : null;
  /** Há filtro valendo? Marca o ícone para o estado não ficar escondido. */
  const hasFilter = effectiveTag !== null || sort !== 'recent';

  const filtered = decks.filter(
    d =>
      d.title.toLowerCase().includes(search.toLowerCase()) &&
      (effectiveTag === null || d.tags.includes(effectiveTag)),
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'alpha') return a.title.localeCompare(b.title, 'pt');
    if (sort === 'count') return b.cards.length - a.cards.length;
    // 'recent': último estudo (ou criação) mais recente primeiro.
    const at = new Date(a.lastStudied ?? a.createdAt).getTime();
    const bt = new Date(b.lastStudied ?? b.createdAt).getTime();
    return bt - at;
  });

  const handleExport = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const { deckCount, cardCount } = await exportDecks(user.id);
      void deckCount;
      void cardCount;
      // Avisa se cópias baixadas protegidas ficaram de fora do arquivo.
      const skipped = decks.filter(d => !canExport(d)).length;
      if (skipped > 0) {
        Alert.alert(
          'Alguns decks omitidos',
          `${skipped} ${skipped === 1 ? 'deck baixado protegido' : 'decks baixados protegidos'} não ${skipped === 1 ? 'foi incluído' : 'foram incluídos'} no arquivo, pois o autor não permite exportá-los.`,
        );
      }
      // Fora isso, sem alerta de sucesso: a folha de compartilhamento já confirma.
    } catch (e) {
      if (e instanceof BackupError && e.code === 'EMPTY') {
        Alert.alert('Nada para exportar', 'Crie um baralho antes de exportar.');
      } else {
        Alert.alert('Erro', 'Não foi possível exportar os baralhos.');
      }
    } finally {
      setBusy(false);
    }
  };

  const showImportError = (e: unknown) => {
    let msg: string;
    if (e instanceof BackupError) {
      msg =
        e.code === 'INVALID'
          ? 'O arquivo selecionado não é um backup válido do Blink.'
          : e.code === 'READ'
            ? 'Não consegui ler o arquivo. Salve-o no app Arquivos e tente importar de lá.'
            : 'Nenhum conteúdo válido foi encontrado no arquivo.';
    } else {
      const detail = errorMessage(e, String(e));
      msg = `Não foi possível importar.\n\nDetalhe: ${detail}`;
    }
    Alert.alert('Erro na importação', msg);
  };

  const importDone = async (deckCount: number, cardCount: number) => {
    await reload();
    const parts: string[] = [];
    if (deckCount > 0)
      parts.push(`${deckCount} ${deckCount === 1 ? 'baralho' : 'baralhos'}`);
    if (cardCount > 0)
      parts.push(`${cardCount} ${cardCount === 1 ? 'cartão' : 'cartões'}`);
    Alert.alert(
      'Importação concluída',
      parts.length > 0 ? `${parts.join(' e ')} importados.` : 'Nada foi importado.',
    );
  };

  // Escolhe o arquivo, decide o fluxo (baralho x cartões) e abre o modal certo.
  const handleImport = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const raw = await pickBackupFile();
      if (raw == null) return; // cancelado na seleção de arquivo
      const parsed = parseBackup(raw);

      if (parsed.kind === 'cards') {
        setCardState({ cards: parsed.cards, source: parsed.source });
        return;
      }

      const plan = buildImportPlan(
        decks.map(d => ({ id: d.id, title: d.title })),
        parsed.decks,
      );
      if (plan.conflicts.length === 0) {
        const res = await applyDeckImport(user.id, {
          newDecks: plan.newDecks,
          resolutions: [],
          existingTitles: decks.map(d => d.title),
        });
        await importDone(res.deckCount, res.cardCount);
      } else {
        setConflictState({ newDecks: plan.newDecks, conflicts: plan.conflicts });
      }
    } catch (e) {
      showImportError(e);
    } finally {
      setBusy(false);
    }
  };

  // Conclui a importação de baralhos após o usuário resolver os conflitos.
  const resolveConflicts = async (resolutions: ConflictResolution[]) => {
    const state = conflictState;
    setConflictState(null);
    if (!user || !state) return;
    setBusy(true);
    try {
      const res = await applyDeckImport(user.id, {
        newDecks: state.newDecks,
        resolutions,
        existingTitles: decks.map(d => d.title),
      });
      await importDone(res.deckCount, res.cardCount);
    } catch (e) {
      showImportError(e);
    } finally {
      setBusy(false);
    }
  };

  // Conclui a importação de um pacote de cartões no destino escolhido.
  const pickCardTarget = async (target: CardImportTarget) => {
    const state = cardState;
    setCardState(null);
    if (!user || !state) return;
    setBusy(true);
    try {
      const res = await applyCardImport(user.id, target, state.cards);
      await importDone(res.deckCount, res.cardCount);
    } catch (e) {
      showImportError(e);
    } finally {
      setBusy(false);
    }
  };

  const confirmBackup = () => {
    Alert.alert('Baralhos', 'O que você quer fazer?', [
      { text: 'Exportar todos', onPress: () => void handleExport() },
      { text: 'Importar de arquivo', onPress: () => void handleImport() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      {/* Cabeçalho + busca revelada ao puxar viajam DENTRO da lista, como nas
          outras abas: título à esquerda, ações à direita, rolando junto com o
          conteúdo em vez de flutuar sobre ele. */}
      <FlatList
        data={sorted}
        keyExtractor={d => d.id}
        onScroll={handleScroll}
        scrollEventThrottle={tabScroll.scrollEventThrottle}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: tabBar.contentInset,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {/* Header — mesmo ritmo (pt-6 / pb-4 / text-3xl) das demais abas.
                O padding horizontal já vem do contentContainerStyle. */}
            <View className="pt-6 pb-4 flex-row items-center justify-between">
              <Text
                className="text-on-surface font-jakarta-extrabold text-3xl"
                style={{ letterSpacing: -0.5 }}
              >
                Decks
              </Text>

              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={confirmBackup}
                  disabled={busy}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Exportar ou importar baralhos"
                  className="w-10 h-10 items-center justify-center rounded-button bg-surface-container"
                  style={{ opacity: busy ? 0.5 : 1, ...cardShadow }}
                >
                  <Ionicons
                    name="swap-vertical"
                    size={20}
                    color={colors.onSurface}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/deck/create')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Criar deck"
                  className="w-10 h-10 items-center justify-center rounded-button bg-surface-container"
                  style={cardShadow}
                >
                  <Ionicons name="add" size={22} color={colors.onSurface} />
                </TouchableOpacity>
              </View>
            </View>

            <RevealSearchBar
              search={reveal}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar decks..."
              onOpenFilters={() => setFiltersOpen(true)}
              hasFilter={hasFilter}
            />
          </View>
        }
        ListEmptyComponent={
          <View className="items-center mt-16 px-6">
            <View
              className="w-16 h-16 rounded-card items-center justify-center mb-4"
              style={{ backgroundColor: colors.primary + '22' }}
            >
              <Ionicons
                name={search.length > 0 ? 'search' : 'albums'}
                size={26}
                color={colors.primary}
              />
            </View>
            <Text className="text-on-surface font-jakarta-bold text-lg text-center">
              {search.length > 0
                ? 'Nenhum deck encontrado'
                : 'Nenhum deck ainda'}
            </Text>
            <Text className="text-on-surface-variant font-inter-regular text-sm mt-2 text-center">
              {search.length > 0
                ? 'Tente outra busca'
                : 'Toque em + para criar seu primeiro deck'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SwipeableDeckRow
            onDelete={() =>
              Alert.alert(
                'Excluir deck',
                `Deseja excluir "${item.title}"? Esta ação não pode ser desfeita.`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => void deleteDeck(item.id),
                  },
                ],
              )
            }
            onExport={() =>
              void exportDeck(item).catch((e: unknown) => {
                Alert.alert(
                  'Erro',
                  e instanceof BackupError && e.code === 'EMPTY'
                    ? 'Adicione cards antes de exportar.'
                    : 'Não foi possível exportar o deck.',
                );
              })
            }
            onEdit={() => router.push(`/deck/edit?id=${item.id}`)}
            canExport={canExport(item)}
          >
            <DeckCard
              deck={item}
              onPress={() => router.push(`/deck/${item.id}`)}
              onPlay={() => picker.requestPlay(item)}
            />
          </SwipeableDeckRow>
        )}
      />

      {/* Filtros (ordenação + tag) — abertos pelo ícone dentro da busca */}
      <FilterSheet
        visible={filtersOpen}
        sorts={DECK_SORTS}
        sort={sort}
        onSortChange={setSort}
        tags={allTags}
        activeTag={effectiveTag}
        onTagChange={setActiveTag}
        onClose={() => setFiltersOpen(false)}
      />

      {/* Conflito de baralho na importação */}
      <ImportConflictModal
        visible={conflictState != null}
        conflicts={conflictState?.conflicts ?? []}
        onCancel={() => setConflictState(null)}
        onResolve={r => void resolveConflicts(r)}
      />

      {/* Destino de um pacote de cartões importado */}
      <DeckPickerModal
        visible={cardState != null}
        decks={decks.map(d => ({
          id: d.id,
          title: d.title,
          coverUrl: d.coverUrl,
        }))}
        cardCount={cardState?.cards.length ?? 0}
        sourceTitle={cardState?.source?.title ?? null}
        onCancel={() => setCardState(null)}
        onPick={t => void pickCardTarget(t)}
      />

      {/* Seletor de modo de estudo (play) */}
      <StudyModePicker deck={picker.pickerDeck} onClose={picker.close} />
    </SafeAreaView>
  );
}
