import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
  type Href,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  getCommunityDeck,
  listReviews,
  hasDownloaded,
  hasLocalCopy,
  getMyRating,
  downloadDeck,
  rateDeck,
  reportDeck,
  replyToRating,
  unpublishById,
} from '@/services/community';
import type {
  CommunityDeckRow,
  CommunityCardRow,
  DeckRatingRow,
  ReportReason,
} from '@/types/db';
import { isDerived, presetFor } from '@/utils/community';
import { useAuth } from '@/contexts/AuthContext';
import { StarRating } from '@/components/StarRating';
import { ReviewComposer } from '@/components/ReviewComposer';
import { Button } from '@/components/ui/Button';
import { cardShadow } from '@/components/ui/Card';
import { errorMessage } from '@/utils/errors';
import { useThemeColors } from '@/hooks/useThemeColors';

/** Questões mostradas de cara; o resto vem no "Ver todas". */
const INITIAL_CARDS = 8;

/** Avatar pequeno de autor/avaliador (foto ou inicial). */
function MiniAvatar({
  url,
  name,
  size = 28,
}: {
  url: string | null;
  name: string | null;
  size?: number;
}) {
  const colors = useThemeColors();
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primaryContainer,
      }}
      className="items-center justify-center"
    >
      <Text
        className="text-on-primary-container font-jakarta-bold"
        style={{ fontSize: size * 0.45 }}
      >
        {(name?.trim()[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}

/** Resposta do autor do deck a uma avaliação, aninhada sob ela. */
function AuthorReply({
  text,
  at,
  authorName,
}: {
  text: string;
  at: string | null;
  authorName: string | null;
}) {
  const colors = useThemeColors();
  return (
    <View className="bg-surface-container-high rounded-button p-3 gap-1">
      <View className="flex-row items-center gap-1.5">
        <Ionicons
          name="return-down-forward"
          size={13}
          color={colors.primary}
        />
        <Text className="text-primary font-inter-semibold text-xs flex-1" numberOfLines={1}>
          Resposta de {authorName ?? 'autor'}
        </Text>
        {at != null && (
          <Text className="text-outline font-inter-regular text-xs">
            {formatDistanceToNow(new Date(at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </Text>
        )}
      </View>
      <Text className="text-on-surface-variant font-inter-regular text-sm leading-5">
        {text}
      </Text>
    </View>
  );
}

/** Um número da faixa de métricas (nota, downloads, cards). */
function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
}) {
  const colors = useThemeColors();
  return (
    <View
      className="flex-1 items-center bg-surface-container rounded-card py-3"
      style={cardShadow}
    >
      <Ionicons name={icon} size={15} color={colors.outline} />
      <Text className="text-on-surface font-jakarta-bold text-base mt-1">
        {value}
      </Text>
      <Text className="text-outline font-inter-regular text-xs mt-0.5">
        {label}
      </Text>
    </View>
  );
}

export default function CommunityDeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { user, profile } = useAuth();

  const [deck, setDeck] = useState<CommunityDeckRow | null>(null);
  const [cards, setCards] = useState<CommunityCardRow[]>([]);
  const [reviews, setReviews] = useState<DeckRatingRow[]>([]);
  // Dois conceitos distintos: ter uma cópia AGORA (controla o botão Baixar —
  // excluiu a cópia? pode baixar de novo) × já ter baixado ALGUM DIA
  // (registro permanente; é o que libera avaliar).
  const [hasCopy, setHasCopy] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Leitura das questões: a lista abre com as primeiras e cada resposta é
  // revelada no toque (ou todas de uma vez), para dar pra conferir o conteúdo
  // ANTES de baixar sem transformar a página num paredão de texto.
  const [showAllCards, setShowAllCards] = useState(false);
  const [revealAll, setRevealAll] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  // Avaliação do usuário (a linha salva) + rascunhos da caixa de escrita, que
  // é ancorada ao teclado (ver `ReviewComposer`).
  const [myRating, setMyRating] = useState<DeckRatingRow | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [composer, setComposer] = useState<
    { mode: 'review' } | { mode: 'reply'; review: DeckRatingRow } | null
  >(null);

  const load = useCallback(async () => {
    if (!id || !user) return;
    const full = await getCommunityDeck(id);
    if (full) {
      setDeck(full.deck);
      setCards(full.cards);
    }
    const [revs, copy, dl, mine] = await Promise.all([
      listReviews(id),
      hasLocalCopy(id, user.id),
      hasDownloaded(id, user.id),
      getMyRating(id, user.id),
    ]);
    setReviews(revs);
    setHasCopy(copy);
    setCanRate(dl);
    setMyRating(mine);
    setLoading(false);
  }, [id, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const toggleCard = (cardId: string) => {
    setRevealed(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const handleDownload = async () => {
    if (!id || !user || downloading) return;
    setDownloading(true);
    try {
      await downloadDeck(user.id, id);
      setHasCopy(true);
      setCanRate(true);
      await load();
      Alert.alert(
        'Deck baixado!',
        'Uma cópia foi adicionada aos seus decks. Agora você pode estudá-la e avaliá-la.',
      );
    } catch (e) {
      Alert.alert('Erro', errorMessage(e, 'Não foi possível baixar o deck.'));
    } finally {
      setDownloading(false);
    }
  };

  const handleReport = () => {
    if (!id || !user) return;
    const send = (reason: ReportReason) =>
      void reportDeck({ communityDeckId: id, userId: user.id, reason })
        .then(() =>
          Alert.alert('Denúncia enviada', 'Obrigado. Vamos analisar este deck.'),
        )
        .catch(e =>
          Alert.alert('Erro', errorMessage(e, 'Não foi possível denunciar.')),
        );
    Alert.alert('Denunciar deck', 'Qual o motivo?', [
      { text: 'Plágio / conteúdo roubado', onPress: () => send('plagiarism') },
      { text: 'Conteúdo impróprio', onPress: () => send('inappropriate') },
      { text: 'Spam', onPress: () => send('spam') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const removePublication = async () => {
    if (!id) return;
    try {
      await unpublishById(id);
      Alert.alert(
        'Removido da comunidade',
        'Seu deck continua nos seus decks, só saiu do catálogo público.',
      );
      router.back();
    } catch (e) {
      Alert.alert('Erro', errorMessage(e, 'Não foi possível remover.'));
    }
  };

  const confirmRemove = () => {
    Alert.alert(
      'Remover da comunidade',
      'O deck sai do catálogo público e as avaliações recebidas são perdidas. Seu deck privado não é afetado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => void removePublication(),
        },
      ],
    );
  };

  const openReviewComposer = () => {
    setStars(myRating?.stars ?? 0);
    setComment(myRating?.comment ?? '');
    setComposer({ mode: 'review' });
  };

  const openReplyComposer = (review: DeckRatingRow) => {
    setReplyDraft(review.author_reply ?? '');
    setComposer({ mode: 'reply', review });
  };

  const handleSubmitRating = async () => {
    if (!id || !user || stars < 1 || submitting) return;
    setSubmitting(true);
    try {
      await rateDeck({
        communityDeckId: id,
        userId: user.id,
        stars,
        comment: comment.trim() || null,
        reviewer: {
          name: profile?.name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        },
      });
      setComposer(null);
      await load();
    } catch (e) {
      Alert.alert('Erro', errorMessage(e, 'Não foi possível avaliar.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async () => {
    if (composer?.mode !== 'reply' || submitting) return;
    setSubmitting(true);
    try {
      await replyToRating(composer.review.id, replyDraft);
      setComposer(null);
      await load();
    } catch (e) {
      const msg = errorMessage(e, '');
      Alert.alert(
        'Erro',
        // A função é nova: banco não migrado devolve "não encontrada".
        /reply_to_rating|not find the function|schema cache/i.test(msg)
          ? 'Seu banco ainda não tem a função de resposta. Execute o supabase/schema.sql atualizado no SQL Editor do Supabase.'
          : msg.includes('NOT_DECK_AUTHOR')
            ? 'Só o autor do deck pode responder às avaliações.'
            : msg || 'Não foi possível responder.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !deck) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const isAuthor = user != null && deck.author_id === user.id;
  const license = presetFor(deck.license);
  const visibleCards = showAllCards ? cards : cards.slice(0, INITIAL_CARDS);
  const othersReviews = reviews.filter(r => r.user_id !== user?.id);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Sem KeyboardAvoidingView: a página não tem mais campo de texto — quem
          lida com o teclado é o `ReviewComposer`, lá embaixo. */}
      <>
        {/* Header */}
        <View className="flex-row items-center px-3 pt-2 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </TouchableOpacity>
          <Text
            className="flex-1 text-on-surface font-jakarta-bold text-base ml-1"
            numberOfLines={1}
          >
            {isAuthor ? 'Sua publicação' : 'Deck da comunidade'}
          </Text>
          {/* Denunciar não faz sentido no próprio deck. */}
          {!isAuthor && (
            <TouchableOpacity onPress={handleReport} hitSlop={8} className="p-2">
              <Ionicons name="flag-outline" size={18} color={colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }}
          showsVerticalScrollIndicator={false}
          // Toque em botão continua funcionando com o teclado aberto...
          keyboardShouldPersistTaps="handled"
          // ...e arrastar a página fecha o teclado. Num campo MULTILINHA o
          // Enter insere quebra de linha em vez de fechar, então sem isto
          // não sobrava nenhuma saída.
          keyboardDismissMode="on-drag"
        >
          {/* Capa + título */}
          {deck.cover_url ? (
            <Image
              source={{ uri: deck.cover_url }}
              style={{ width: '100%', height: 160, borderRadius: 16 }}
              resizeMode="cover"
            />
          ) : null}

          <View>
            <Text className="text-on-surface font-jakarta-extrabold text-2xl">
              {deck.title}
            </Text>
            {deck.description ? (
              <Text className="text-on-surface-variant font-inter-regular text-sm mt-2 leading-5">
                {deck.description}
              </Text>
            ) : null}
          </View>

          {/* Autor */}
          <View className="flex-row items-center gap-2">
            <MiniAvatar url={deck.author_avatar_url} name={deck.author_name} />
            <View className="flex-1">
              <Text
                className="text-on-surface-variant font-inter-medium text-sm"
                numberOfLines={1}
              >
                {deck.author_name ?? 'Anônimo'}
              </Text>
              {isDerived(deck) ? (
                <Text
                  className="text-outline font-inter-regular text-xs"
                  numberOfLines={1}
                >
                  Adaptado de {deck.original_author_name ?? 'outro autor'}
                </Text>
              ) : (
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name={license.icon}
                    size={12}
                    color={colors.outline}
                  />
                  <Text className="text-outline font-inter-regular text-xs">
                    {license.label}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Métricas */}
          <View className="flex-row gap-2">
            <Metric
              icon="star"
              value={deck.rating_count > 0 ? deck.rating_avg.toFixed(1) : '—'}
              label={
                deck.rating_count > 0
                  ? `${deck.rating_count} ${deck.rating_count === 1 ? 'nota' : 'notas'}`
                  : 'sem notas'
              }
            />
            <Metric
              icon="download-outline"
              value={String(deck.downloads_count)}
              label={deck.downloads_count === 1 ? 'download' : 'downloads'}
            />
            <Metric
              icon="layers-outline"
              value={String(deck.card_count)}
              label={deck.card_count === 1 ? 'questão' : 'questões'}
            />
          </View>

          {/* Tags do deck — mesma fonte que alimenta o filtro por categoria da
              aba Comunidade. Só aparece quando há tags. */}
          {deck.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {deck.tags.map(tag => (
                <View
                  key={tag}
                  className="bg-surface-container-high rounded-full px-3 py-1.5"
                >
                  <Text className="text-outline font-inter-medium text-xs">
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Ação principal. Para o AUTOR, o lugar de editar a publicação é
              aqui — vendo o que o público vê — e não na tela de publicar, que
              serve para colocar um deck novo no ar. */}
          {isAuthor ? (
            <View
              className="gap-3 bg-surface-container rounded-card p-4"
              style={cardShadow}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="earth" size={18} color={colors.primary} />
                <Text className="flex-1 text-on-surface font-jakarta-bold text-base">
                  Publicado na comunidade
                </Text>
              </View>
              <Text className="text-outline font-inter-regular text-xs leading-4">
                {deck.source_playlist_id != null
                  ? 'Editar atualiza a publicação com a descrição, as tags, a licença e os cards atuais do seu deck.'
                  : 'O deck de origem foi excluído, então esta publicação não pode mais ser atualizada — só removida.'}
              </Text>
              {deck.source_playlist_id != null && (
                <Button
                  variant="primary"
                  size="md"
                  onPress={() =>
                    router.push(
                      `/community/publish?deckId=${deck.source_playlist_id}` as Href,
                    )
                  }
                >
                  Editar publicação
                </Button>
              )}
              <TouchableOpacity
                onPress={confirmRemove}
                activeOpacity={0.7}
                className="items-center py-2"
              >
                <Text className="text-error font-inter-semibold text-sm">
                  Remover da comunidade
                </Text>
              </TouchableOpacity>
            </View>
          ) : hasCopy ? (
            // O selo só aparece enquanto a cópia EXISTE nos seus decks;
            // excluiu a cópia? o botão volta e dá para baixar de novo.
            <View
              className="flex-row items-center justify-center gap-2 py-3 rounded-card bg-surface-container"
              style={cardShadow}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.success}
              />
              <Text className="text-on-surface font-inter-semibold text-sm">
                Já está nos seus decks
              </Text>
            </View>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onPress={() => void handleDownload()}
              loading={downloading}
            >
              {downloading
                ? 'Baixando...'
                : canRate
                  ? 'Baixar de novo'
                  : 'Baixar deck'}
            </Button>
          )}

          {/* Questões — o deck inteiro, para dar pra decidir antes de baixar */}
          <View className="gap-2">
            <View className="flex-row items-center">
              <Text className="flex-1 text-on-surface font-jakarta-bold text-base">
                Questões {cards.length > 0 ? `(${cards.length})` : ''}
              </Text>
              {cards.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setRevealAll(v => !v);
                    setRevealed(new Set());
                  }}
                  hitSlop={8}
                  activeOpacity={0.7}
                >
                  <Text className="text-primary font-inter-semibold text-xs">
                    {revealAll ? 'Ocultar respostas' : 'Mostrar respostas'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {cards.length === 0 ? (
              <Text className="text-outline font-inter-regular text-sm">
                Esta publicação está sem questões.
              </Text>
            ) : (
              visibleCards.map((c, index) => {
                const open = revealAll || revealed.has(c.id);
                return (
                  <TouchableOpacity
                    key={c.id}
                    activeOpacity={0.8}
                    onPress={() => toggleCard(c.id)}
                    className="bg-surface-container rounded-card p-4 flex-row items-start gap-2.5"
                    style={cardShadow}
                  >
                    <Text className="text-outline font-inter-regular text-xs mt-0.5 w-5">
                      {index + 1}.
                    </Text>
                    <View className="flex-1">
                      <Text className="text-on-surface font-inter-medium text-sm leading-5">
                        {c.front}
                      </Text>

                      {open ? (
                        <>
                          <Text className="text-on-surface-variant font-inter-regular text-sm mt-2 leading-5">
                            {c.back}
                          </Text>
                          {/* `quiz_options` guarda as alternativas ERRADAS —
                              a certa é o verso. */}
                          {c.quiz_options.length > 0 && (
                            <View className="mt-2 gap-1">
                              <Text className="text-outline font-inter-semibold text-xs tracking-widest">
                                OUTRAS ALTERNATIVAS
                              </Text>
                              {c.quiz_options.map((opt, k) => (
                                <Text
                                  key={k}
                                  className="text-outline font-inter-regular text-xs leading-4"
                                >
                                  • {opt}
                                </Text>
                              ))}
                            </View>
                          )}
                        </>
                      ) : (
                        <Text className="text-outline font-inter-regular text-xs mt-1.5">
                          Toque para ver a resposta
                        </Text>
                      )}

                      {c.images.length > 0 && (
                        <View className="flex-row items-center gap-1 mt-1.5">
                          <Ionicons
                            name="image"
                            size={12}
                            color={colors.outline}
                          />
                          <Text className="text-outline font-inter-regular text-xs">
                            {c.images.length}{' '}
                            {c.images.length === 1 ? 'imagem' : 'imagens'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={15}
                      color={colors.outline}
                    />
                  </TouchableOpacity>
                );
              })
            )}

            {!showAllCards && cards.length > INITIAL_CARDS && (
              <TouchableOpacity
                onPress={() => setShowAllCards(true)}
                activeOpacity={0.8}
                className="items-center py-3 rounded-card border border-outline-variant"
              >
                <Text className="text-on-surface font-inter-semibold text-sm">
                  Ver todas as {cards.length} questões
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sua avaliação — quem já baixou ALGUM DIA pode avaliar, mesmo que
              tenha excluído a cópia (usou o deck, a opinião vale). */}
          {canRate && !isAuthor && (
            <View
              className="gap-3 bg-surface-container rounded-card p-4"
              style={cardShadow}
            >
              <View className="flex-row items-center">
                <Text className="flex-1 text-on-surface font-jakarta-bold text-base">
                  Sua avaliação
                </Text>
                <TouchableOpacity
                  onPress={openReviewComposer}
                  hitSlop={10}
                  activeOpacity={0.7}
                >
                  <Text className="text-primary font-inter-semibold text-sm">
                    {myRating != null ? 'Editar' : 'Escrever'}
                  </Text>
                </TouchableOpacity>
              </View>

              {myRating != null ? (
                <>
                  <StarRating value={myRating.stars} size={18} />
                  {myRating.comment ? (
                    <Text className="text-on-surface-variant font-inter-regular text-sm leading-5">
                      {myRating.comment}
                    </Text>
                  ) : null}
                  {myRating.author_reply != null && (
                    <AuthorReply
                      text={myRating.author_reply}
                      at={myRating.author_reply_at}
                      authorName={deck.author_name}
                    />
                  )}
                </>
              ) : (
                <Text className="text-outline font-inter-regular text-sm leading-5">
                  Estudou com este deck? Conte o que achou — é o que ajuda quem
                  ainda está decidindo.
                </Text>
              )}
            </View>
          )}

          {/* Avaliações da comunidade — a sua sai da lista: ela já tem o bloco
              "Sua avaliação" acima, com a resposta do autor junto. */}
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 text-on-surface font-jakarta-bold text-base">
                Avaliações {othersReviews.length > 0 ? `(${othersReviews.length})` : ''}
              </Text>
              {deck.rating_count > 0 && (
                <StarRating value={deck.rating_avg} size={14} />
              )}
            </View>
            {othersReviews.length === 0 ? (
              <Text className="text-outline font-inter-regular text-sm">
                {isAuthor
                  ? 'Ainda sem avaliações. Elas aparecem aqui quando alguém baixar e avaliar seu deck.'
                  : 'Ainda sem avaliações de outras pessoas.'}
              </Text>
            ) : (
              othersReviews.map(r => (
                <View
                  key={r.id}
                  className="bg-surface-container rounded-card p-4 gap-2"
                  style={cardShadow}
                >
                  <View className="flex-row items-center gap-2">
                    <MiniAvatar
                      url={r.reviewer_avatar_url}
                      name={r.reviewer_name}
                      size={26}
                    />
                    <Text
                      className="text-on-surface font-inter-semibold text-sm flex-1"
                      numberOfLines={1}
                    >
                      {r.reviewer_name ?? 'Anônimo'}
                    </Text>
                    <Text className="text-outline font-inter-regular text-xs">
                      {formatDistanceToNow(new Date(r.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </Text>
                  </View>
                  <StarRating value={r.stars} size={13} />
                  {r.comment ? (
                    <Text className="text-on-surface-variant font-inter-regular text-sm leading-5">
                      {r.comment}
                    </Text>
                  ) : null}

                  {r.author_reply != null && (
                    <AuthorReply
                      text={r.author_reply}
                      at={r.author_reply_at}
                      authorName={deck.author_name}
                    />
                  )}

                  {/* Responder é do autor do deck, e só dele. */}
                  {isAuthor && (
                    <TouchableOpacity
                      onPress={() => openReplyComposer(r)}
                      activeOpacity={0.7}
                      hitSlop={6}
                      className="flex-row items-center gap-1.5 self-start pt-1"
                    >
                      <Ionicons
                        name="return-down-forward-outline"
                        size={14}
                        color={colors.primary}
                      />
                      <Text className="text-primary font-inter-semibold text-sm">
                        {r.author_reply != null
                          ? 'Editar resposta'
                          : 'Responder'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </>

      {/* Escrita ancorada ao teclado — o campo nunca fica coberto. Fica FORA do
          KeyboardAvoidingView de propósito: a folha já sobe pela altura do
          teclado, e dentro dele o ajuste seria aplicado duas vezes. */}
      {composer?.mode === 'review' && (
        <ReviewComposer
          title={myRating != null ? 'Editar sua avaliação' : 'Sua avaliação'}
          stars={stars}
          onStarsChange={setStars}
          value={comment}
          onChangeText={setComment}
          placeholder="Escreva um comentário (opcional)"
          submitLabel="Enviar avaliação"
          submitting={submitting}
          canSubmit={stars >= 1}
          onClose={() => setComposer(null)}
          onSubmit={() => void handleSubmitRating()}
        />
      )}
      {composer?.mode === 'reply' && (
        <ReviewComposer
          title={
            composer.review.author_reply != null
              ? 'Editar resposta'
              : 'Responder avaliação'
          }
          context={
            composer.review.comment ??
            `${composer.review.reviewer_name ?? 'Anônimo'} deu ${composer.review.stars} ${composer.review.stars === 1 ? 'estrela' : 'estrelas'}`
          }
          value={replyDraft}
          onChangeText={setReplyDraft}
          placeholder="Responda como autor do deck..."
          submitLabel="Publicar resposta"
          submitting={submitting}
          canSubmit={
            replyDraft.trim().length > 0 ||
            composer.review.author_reply != null
          }
          onClose={() => setComposer(null)}
          onSubmit={() => void handleSubmitReply()}
        />
      )}
    </SafeAreaView>
  );
}
