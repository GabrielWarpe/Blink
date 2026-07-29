import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
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
import { GlassSurface } from '@/components/ui/GlassSurface';
import {
  DeckFilterSheet,
  type DeckSort,
} from '@/components/DeckFilterSheet';
import {
  ImportConflictModal,
  type ConflictResolution,
} from '@/components/ImportConflictModal';
import { DeckPickerModal } from '@/components/DeckPickerModal';

/** Altura do cabeçalho flutuante — a lista reserva isso no topo. */
const HEADER_HEIGHT = 60;
/** Altura da barra de busca quando revelada. */
const SEARCH_HEIGHT = 56;
/** Quanto puxar além do topo para revelar a busca. */
const PULL_TO_REVEAL = 40;
/** A partir daqui a busca se esconde de novo (só se estiver vazia). */
const SCROLL_TO_HIDE = 60;

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

  // ── Busca revelada ao puxar (padrão iOS: Mail/Mensagens) ────────────────
  // Fica escondida por padrão para não comer altura em toda rolagem. Puxar o
  // conteúdo além do topo revela; rolar para dentro da lista esconde de novo —
  // mas NUNCA enquanto houver texto digitado, senão o filtro sumiria da vista
  // ainda valendo.
  const searchH = useSharedValue(0);
  const searchOpen = useRef(false);
  const searchRef = useRef<TextInput>(null);

  const toggleSearch = (open: boolean) => {
    if (searchOpen.current === open) return;
    searchOpen.current = open;
    searchH.value = withTiming(open ? SEARCH_HEIGHT : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    if (!open) searchRef.current?.blur();
  };

  // O `useTabBarScroll` também precisa deste evento (encolhe a barra de abas),
  // então os dois são compostos aqui em vez de disputar o `onScroll`.
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    tabScroll.onScroll(e);
    const y = e.nativeEvent.contentOffset.y;
    if (y < -PULL_TO_REVEAL) toggleSearch(true);
    else if (y > SCROLL_TO_HIDE && search.length === 0) toggleSearch(false);
  };

  const searchStyle = useAnimatedStyle(() => ({
    height: searchH.value,
    opacity: interpolate(searchH.value, [0, SEARCH_HEIGHT], [0, 1]),
  }));
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
      {/* Busca revelada ao puxar + lista. A lista fica ATRÁS do cabeçalho
          flutuante (por isso o paddingTop): assim os cards passam por baixo do
          botão de vidro e o desfoque tem o que borrar — sobre fundo chapado,
          vidro não mostra nada. */}
      <FlatList
        data={sorted}
        keyExtractor={d => d.id}
        onScroll={handleScroll}
        scrollEventThrottle={tabScroll.scrollEventThrottle}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: HEADER_HEIGHT,
          paddingBottom: tabBar.contentInset,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <Animated.View style={[{ overflow: 'hidden' }, searchStyle]}>
            <View
              className="flex-row items-center bg-surface-container-high rounded-button px-3.5 border border-outline-variant"
              style={{ height: SEARCH_HEIGHT - 12, marginBottom: 12 }}
            >
              <Ionicons name="search" size={18} color={colors.outline} />
              <TextInput
                ref={searchRef}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar decks..."
                placeholderTextColor={colors.outline}
                className="flex-1 px-2 text-on-surface font-inter-regular text-base"
                selectionColor={colors.primary}
                returnKeyType="search"
              />
              <TouchableOpacity
                onPress={() => setFiltersOpen(true)}
                hitSlop={10}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  // Marca quando há filtro ativo — sem isso o estado ficaria
                  // escondido dentro do pop-up.
                  color={hasFilter ? colors.primary : colors.outline}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
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

      {/* Cabeçalho flutuante: (+) de vidro centralizado + backup à direita.
          Sem título — a aba já diz onde você está. Fica SOBRE a lista para os
          cards passarem por baixo do vidro (é isso que dá o que desfocar). */}
      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-5"
        style={{ height: HEADER_HEIGHT }}
      >
        {/* Espelha a largura do botão da direita, para o (+) ficar de fato
            centralizado na tela e não deslocado. */}
        <View style={{ width: 40 }} />

        <TouchableOpacity
          onPress={() => router.push('/deck/create')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Criar deck"
        >
          <GlassSurface
            blur
            radius={24}
            style={{
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={26} color={colors.onSurface} />
          </GlassSurface>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={confirmBackup}
          disabled={busy}
          activeOpacity={0.8}
          className="w-10 h-10 items-center justify-center rounded-button bg-surface-container"
          style={{ opacity: busy ? 0.5 : 1, ...cardShadow }}
        >
          <Ionicons name="swap-vertical" size={20} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Filtros (ordenação + tag) — abertos pelo ícone dentro da busca */}
      <DeckFilterSheet
        visible={filtersOpen}
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
