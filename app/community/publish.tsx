import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useDecks } from '@/hooks/useDecks';
import {
  listMyPublished,
  publishDeck,
  REPUBLISH_FORBIDDEN,
} from '@/services/community';
import {
  isDownloadedCopy,
  canRepublish,
  LICENSE_PRESETS,
  presetFor,
} from '@/utils/community';
import { errorMessage } from '@/utils/errors';
import type { Deck } from '@/types';
import type { CommunityDeckRow, DeckLicense } from '@/types/db';
import { DeckAvatar } from '@/components/DeckAvatar';
import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/TagInput';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Publicar na comunidade em dois passos: escolher o deck e descrever a
 * publicação (descrição, tags e licença).
 *
 * O que pode ser publicado sai das MESMAS regras da edição do deck
 * (`utils/community`): deck autoral pode sempre; cópia baixada só se o autor
 * original permitir redistribuir. Deck JÁ publicado aparece só marcado, sem ser
 * escolhível: mexer numa publicação existente é outra intenção, e o lugar dela
 * é a própria página da publicação (`/community/[id]`), onde o autor vê o que o
 * público vê. De lá, "Editar publicação" volta para cá com `?deckId=`, já no
 * passo 2 e sem lista.
 */
export default function PublishDeckScreen() {
  const router = useRouter();
  // Presente = veio de "Editar publicação"; a tela abre direto no formulário.
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const editMode = deckId != null;
  const colors = useThemeColors();
  const { user, profile } = useAuth();
  const { decks, loading: decksLoading } = useDecks();

  const [published, setPublished] = useState<Map<string, CommunityDeckRow>>(
    new Map(),
  );
  const [loadingPublished, setLoadingPublished] = useState(true);

  // Passo 2: null = ainda escolhendo o deck.
  const [selected, setSelected] = useState<Deck | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [license, setLicense] = useState<DeckLicense>('protected');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void listMyPublished(user.id).then(map => {
      if (cancelled) return;
      setPublished(map);
      setLoadingPublished(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Tags dos outros decks, como sugestão de 1 toque (mesma fonte da edição).
  const tagSuggestions = [
    ...new Set(decks.filter(d => d.id !== selected?.id).flatMap(d => d.tags)),
  ].sort((a, b) => a.localeCompare(b, 'pt'));

  /** Por que este deck NÃO pode ser publicado agora (null = pode). */
  const blockedReason = (deck: Deck): string | null => {
    if (isDownloadedCopy(deck) && !canRepublish(deck)) {
      return 'Baixado da comunidade — o autor não permite republicar.';
    }
    if (deck.cards.length === 0) return 'Adicione cards antes de publicar.';
    return null;
  };

  const pickDeck = (deck: Deck) => {
    const snapshot = published.get(deck.id);
    setSelected(deck);
    // Editando: parte do que já está no ar; publicando pela 1ª vez: parte do
    // próprio deck.
    setDescription(snapshot?.description ?? deck.description ?? '');
    setTags(snapshot?.tags ?? deck.tags);
    setLicense(snapshot?.license ?? 'protected');
  };

  // Modo edição: escolhe o deck do parâmetro assim que os dados chegam. O ref
  // impede que o efeito re-selecione (o usuário nunca "volta para a lista"
  // aqui, mas um reload de `decks` não deve descartar o que ele digitou).
  const autoPicked = useRef(false);
  useEffect(() => {
    if (autoPicked.current || deckId == null) return;
    if (decksLoading || loadingPublished) return;
    const target = decks.find(d => d.id === deckId);
    if (!target) return;
    autoPicked.current = true;
    pickDeck(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, decks, decksLoading, loadingPublished, published]);

  const handlePublish = async () => {
    if (!user || !selected || publishing) return;
    setPublishing(true);
    try {
      const trimmed = description.trim();
      // A publicação é um snapshot do deck, então descrição/tags valem para os
      // dois — salva no deck de trabalho antes de congelar o snapshot.
      try {
        await db.playlists.update(selected.id, {
          description: trimmed || null,
          tags,
        });
      } catch (e) {
        // Banco sem as colunas novas: publica assim mesmo (as tabelas
        // `community_*` são outras), mas avisa que o deck local não guardou.
        const msg = errorMessage(e, '');
        if (!/tags|description/i.test(msg)) throw e;
        Alert.alert(
          'Banco desatualizado',
          'A descrição/tags não foram salvas no seu deck: o banco Supabase ainda não tem as colunas novas. Execute o supabase/schema.sql no SQL Editor.',
        );
      }

      const communityId = await publishDeck(
        user.id,
        { ...selected, description: trimmed, tags },
        { name: profile?.name ?? null, avatarUrl: profile?.avatar_url ?? null },
        license,
      );

      const updated = published.has(selected.id);
      Alert.alert(
        updated ? 'Publicação atualizada' : 'Deck publicado!',
        updated
          ? 'A publicação foi atualizada com o conteúdo e as informações atuais.'
          : 'Seu deck já está na comunidade e pode ser encontrado por outras pessoas.',
        // Editando, o autor veio da própria publicação: voltar já a mostra
        // atualizada (a página recarrega ao ganhar foco).
        updated
          ? [{ text: 'OK', onPress: () => router.back() }]
          : [
              { text: 'Fechar', style: 'cancel', onPress: () => router.back() },
              {
                text: 'Ver publicação',
                onPress: () =>
                  router.replace(`/community/${communityId}` as Href),
              },
            ],
      );
    } catch (e) {
      const msg = errorMessage(e, '');
      Alert.alert(
        'Não foi possível publicar',
        msg.includes(REPUBLISH_FORBIDDEN)
          ? 'Este deck foi baixado da comunidade e o autor original não permite republicá-lo.'
          : 'Tente de novo. Se persistir, rode o supabase/schema.sql atualizado no Supabase.\n\n' +
              msg,
      );
    } finally {
      setPublishing(false);
    }
  };

  const loading = decksLoading || loadingPublished;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Header — publicando, a seta do passo 2 volta para a lista; editando,
            não há lista para onde voltar, então ela fecha a tela. */}
        <View className="flex-row items-center px-4 pt-2 pb-4 border-b border-outline-variant/20">
          <TouchableOpacity
            onPress={() =>
              selected && !editMode ? setSelected(null) : router.back()
            }
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel={selected && !editMode ? 'Voltar' : 'Fechar'}
          >
            <Ionicons
              name={selected && !editMode ? 'arrow-back' : 'close'}
              size={24}
              color={colors.onSurface}
            />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-on-surface font-jakarta-bold text-lg">
            {editMode ? 'Editar publicação' : 'Publicar deck'}
          </Text>
          {selected ? (
            <TouchableOpacity
              onPress={() => void handlePublish()}
              disabled={publishing}
              className="p-2"
            >
              <Text
                className="text-primary font-inter-semibold text-base"
                style={{ opacity: publishing ? 0.5 : 1 }}
              >
                {publishing
                  ? 'Salvando...'
                  : editMode
                    ? 'Salvar'
                    : 'Publicar'}
              </Text>
            </TouchableOpacity>
          ) : (
            // Espelha a largura do botão da esquerda, para o título ficar
            // centralizado de fato.
            <View style={{ width: 40 }} />
          )}
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : editMode && selected == null ? (
          // Veio de uma publicação cujo deck de origem não existe mais.
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons
              name="alert-circle-outline"
              size={28}
              color={colors.outline}
            />
            <Text className="text-on-surface font-jakarta-bold text-base text-center mt-3">
              Deck não encontrado
            </Text>
            <Text className="text-on-surface-variant font-inter-regular text-sm text-center mt-2">
              O deck desta publicação não está mais nos seus decks, então ela
              não pode ser atualizada — só removida.
            </Text>
          </View>
        ) : selected == null ? (
          // ── Passo 1: escolher o deck ──────────────────────────────────────
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-on-surface-variant font-inter-regular text-sm mb-4">
              Escolha um deck seu para publicar. Ele vira uma cópia pública
              (snapshot) — seu deck continua privado e editável.
            </Text>

            {decks.length === 0 ? (
              <View className="items-center pt-16 px-6">
                <View
                  className="w-16 h-16 rounded-card items-center justify-center mb-4"
                  style={{ backgroundColor: colors.primary + '22' }}
                >
                  <Ionicons name="albums" size={26} color={colors.primary} />
                </View>
                <Text className="text-on-surface font-jakarta-bold text-lg text-center">
                  Nenhum deck para publicar
                </Text>
                <Text className="text-on-surface-variant font-inter-regular text-sm mt-2 text-center">
                  Crie um deck na aba Decks e volte aqui.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {decks.map(deck => {
                  const snapshot = published.get(deck.id);
                  // Já publicado não é escolhível aqui: esta tela põe deck novo
                  // no ar. Mexer no que já está publicado é pela página da
                  // publicação (botão "Editar publicação").
                  const reason =
                    snapshot != null
                      ? 'Já publicado — edite pela página da publicação.'
                      : blockedReason(deck);
                  const count = `${deck.cards.length} ${deck.cards.length === 1 ? 'card' : 'cards'}`;
                  return (
                    <TouchableOpacity
                      key={deck.id}
                      onPress={() => pickDeck(deck)}
                      disabled={reason != null}
                      activeOpacity={0.8}
                      className="flex-row items-center gap-3 bg-surface-container rounded-card p-3"
                      style={{ opacity: reason != null ? 0.45 : 1 }}
                    >
                      <DeckAvatar
                        coverUrl={deck.coverUrl}
                        size={48}
                        radius={12}
                      />
                      <View className="flex-1">
                        <Text
                          className="text-on-surface font-jakarta-bold text-sm"
                          numberOfLines={1}
                        >
                          {deck.title}
                        </Text>
                        <Text
                          className="text-outline font-inter-regular text-xs mt-0.5"
                          numberOfLines={2}
                        >
                          {reason ?? count}
                        </Text>
                      </View>
                      {snapshot != null ? (
                        <View className="px-2 py-1 rounded-pill bg-surface-container-high">
                          <Text className="text-outline font-inter-semibold text-xs">
                            PUBLICADO
                          </Text>
                        </View>
                      ) : reason != null ? (
                        <Ionicons
                          name="lock-closed"
                          size={18}
                          color={colors.outline}
                        />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.outline}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        ) : (
          // ── Passo 2: descrição, tags e licença ────────────────────────────
          <ScrollView
            contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Deck escolhido */}
            <View className="flex-row items-center gap-3">
              <DeckAvatar coverUrl={selected.coverUrl} size={52} radius={14} />
              <View className="flex-1">
                <Text
                  className="text-on-surface font-jakarta-bold text-base"
                  numberOfLines={1}
                >
                  {selected.title}
                </Text>
                <Text className="text-outline font-inter-regular text-xs mt-0.5">
                  {selected.cards.length}{' '}
                  {selected.cards.length === 1 ? 'card' : 'cards'}
                  {published.has(selected.id) ? ' · publicado' : ''}
                </Text>
              </View>
              {/* Editando, o deck é fixo — não há lista para trocar. */}
              {!editMode && (
                <TouchableOpacity
                  onPress={() => setSelected(null)}
                  hitSlop={10}
                  activeOpacity={0.7}
                >
                  <Text className="text-primary font-inter-semibold text-sm">
                    Trocar
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Input
              label="Descrição da publicação"
              placeholder="O que este deck cobre, para quem serve..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
              hint="Aparece na página do deck e ajuda quem procura a decidir."
            />

            <TagInput
              tags={tags}
              onChange={setTags}
              suggestions={tagSuggestions}
            />

            {/* Licença — mesmas opções da edição do deck */}
            <View className="gap-2">
              <Text className="text-on-surface-variant font-inter-medium text-sm">
                Quem baixar pode:
              </Text>
              <View className="flex-row gap-2">
                {LICENSE_PRESETS.map(p => {
                  const active = license === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setLicense(p.id)}
                      activeOpacity={0.8}
                      className={`flex-1 items-center py-2.5 rounded-card border ${
                        active
                          ? 'bg-primary-container border-primary'
                          : 'bg-surface-container border-outline-variant'
                      }`}
                    >
                      <Ionicons
                        name={p.icon}
                        size={20}
                        color={
                          active ? colors.onPrimaryContainer : colors.outline
                        }
                      />
                      <Text
                        className={`font-inter-semibold text-xs mt-1 ${
                          active ? 'text-on-primary-container' : 'text-outline'
                        }`}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text className="text-outline font-inter-regular text-xs leading-4">
                {presetFor(license).hint}
              </Text>
              <Text className="text-outline font-inter-regular text-xs leading-4">
                Publique apenas conteúdo seu ou de uso livre. A descrição e as
                tags também são salvas no seu deck.
              </Text>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
