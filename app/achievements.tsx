import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ACHIEVEMENTS,
  getUnlocked,
  buildAchievementStats,
  closestLockedAchievement,
  type Achievement,
} from '@/services/achievements';
import { buildAchievementVisuals } from '@/services/achievementIcons';
import { db } from '@/services/database';
import { computeStreak, computeLongestStreak } from '@/utils/streak';
import { Emblem } from '@/components/Emblem';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/contexts/AuthContext';

const EMBLEM_SIZE = 48;

/**
 * Tira o emoji do começo do título ("🎉 Primeiro deck!" → "Primeiro deck!").
 * O emoji continua no título porque a NOTIFICAÇÃO o usa; aqui o emblema já
 * carrega o significado visual. Títulos sem emoji (patentes) passam intactos.
 */
function stripEmoji(title: string): string {
  const spaceIdx = title.indexOf(' ');
  if (spaceIdx <= 0) return title;
  const head = title.slice(0, spaceIdx);
  // Um "primeiro token" sem letras nem dígitos é o emoji.
  return /\p{L}|\p{N}/u.test(head) ? title : title.slice(spaceIdx + 1);
}

export default function AchievementsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  // "Quase lá": a conquista bloqueada mais perto do desbloqueio (Goal Gradient).
  const [closest, setClosest] = useState<{
    achievement: Achievement;
    progress: number;
  } | null>(null);

  // Os emblemas dependem só da lista estática de conquistas.
  const visuals = useMemo(
    () => buildAchievementVisuals(ACHIEVEMENTS.map(a => a.id)),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      void (async () => {
        const unlockedIds = await getUnlocked(user.id);
        setUnlocked(new Set(unlockedIds));

        // Stats para a proximidade. O "quase lá" só surge de ESCADAS, cujos
        // limiares dependem de sessões/decks/streak — não de leech/retenção,
        // então esses ficam zerados (não afetam nenhuma escada).
        const [sessions, decks] = await Promise.all([
          db.sessions.getRecent(user.id, 2000),
          db.decks.getAll(user.id),
        ]);
        const dates = sessions.map(s => s.date);
        const stats = buildAchievementStats({
          sessions,
          decks,
          currentStreak: computeStreak(dates),
          longestStreak: computeLongestStreak(dates),
          leechesTamed: 0,
          retention30: { total: 0, retained: 0 },
        });
        setClosest(closestLockedAchievement(stats, new Set(unlockedIds)));
      })();
    }, [user?.id]),
  );

  const unlockedCount = ACHIEVEMENTS.filter(a => unlocked.has(a.id)).length;
  const total = ACHIEVEMENTS.length;
  const progress = total > 0 ? unlockedCount / total : 0;

  // Desbloqueadas no topo — o que a pessoa conquistou é a recompensa, e não
  // deve ficar enterrado no fim da lista. `sort` é estável, então dentro de
  // cada grupo a ordem original (a curadoria de ACHIEVEMENTS) se mantém.
  const ordered = useMemo(
    () =>
      [...ACHIEVEMENTS].sort(
        (a, b) => Number(unlocked.has(b.id)) - Number(unlocked.has(a.id)),
      ),
    [unlocked],
  );

  const renderItem = useCallback(
    ({ item: a }: { item: Achievement }) => {
      const isUnlocked = unlocked.has(a.id);
      const visual = visuals[a.id];
      if (!visual) return null;

      return (
        <View
          className="bg-surface-container rounded-card p-4 border border-outline-variant/20 flex-row items-center gap-3 mb-3"
          style={{ opacity: isUnlocked ? 1 : 0.5 }}
        >
          {/* Bloqueada mostra a MESMA silhueta, só que apagada: dá pra ver o
              que se está perseguindo, e a cor vira a recompensa. */}
          <Emblem
            icon={visual.icon}
            tone={isUnlocked ? visual.tone : 'outline'}
            treatment={isUnlocked ? visual.treatment : 'tint'}
            size={EMBLEM_SIZE}
          />

          <View className="flex-1">
            <Text
              className="font-jakarta-bold text-base"
              style={{ color: isUnlocked ? colors.onSurface : colors.onSurfaceVariant }}
            >
              {stripEmoji(a.title)}
            </Text>
            <Text className="text-outline font-inter-regular text-xs mt-0.5 leading-4">
              {a.body}
            </Text>
          </View>

          <Ionicons
            name={isUnlocked ? 'checkmark-circle' : 'lock-closed'}
            size={isUnlocked ? 22 : 16}
            color={isUnlocked ? colors.primary : colors.outline}
          />
        </View>
      );
    },
    [unlocked, visuals, colors],
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-3 pt-2 pb-3 border-b border-outline-variant/15">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text className="flex-1 text-on-surface font-jakarta-bold text-lg ml-1">
          Conquistas
        </Text>
      </View>

      {/* Lista virtualizada: são 200 conquistas, cada uma com um SVG. */}
      <FlatList
        data={ordered}
        keyExtractor={a => a.id}
        renderItem={renderItem}
        extraData={unlocked}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={
          <>
            <View className="bg-surface-container rounded-card p-5 border border-outline-variant/20 mb-3">
              <View className="flex-row items-end justify-between mb-3">
                <Text className="text-on-surface font-jakarta-bold text-lg">
                  Seu progresso
                </Text>
                <Text className="text-primary font-jakarta-extrabold text-xl">
                  {unlockedCount}
                  <Text className="text-outline font-inter-regular text-sm">
                    {' '}
                    / {total}
                  </Text>
                </Text>
              </View>
              <View className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full bg-primary-container"
                  style={{ width: `${progress * 100}%` }}
                />
              </View>
            </View>

            {/* Quase lá: a conquista mais perto de cair. A barra tem piso
                visual (~8%) — nunca 0%, criando momentum (Goal Gradient). */}
            {closest != null &&
              (() => {
                const v = visuals[closest.achievement.id];
                if (!v) return null;
                const barPct = Math.max(closest.progress, 0.08) * 100;
                return (
                  <View
                    className="rounded-card p-4 border mb-5 flex-row items-center gap-3"
                    style={{
                      borderColor: colors.tertiary + '4D',
                      backgroundColor: colors.tertiary + '12',
                    }}
                  >
                    <Emblem
                      icon={v.icon}
                      tone="outline"
                      treatment="tint"
                      size={44}
                    />
                    <View className="flex-1">
                      <Text
                        className="font-inter-semibold text-xs"
                        style={{ color: colors.tertiary }}
                      >
                        QUASE LÁ
                      </Text>
                      <Text
                        className="text-on-surface font-jakarta-bold text-sm mt-0.5"
                        numberOfLines={1}
                      >
                        {stripEmoji(closest.achievement.title)}
                      </Text>
                      <View className="h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-2">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${barPct}%`,
                            backgroundColor: colors.tertiary,
                          }}
                        />
                      </View>
                    </View>
                    <Text
                      className="font-jakarta-extrabold text-base"
                      style={{ color: colors.tertiary, fontVariant: ['tabular-nums'] }}
                    >
                      {Math.round(closest.progress * 100)}%
                    </Text>
                  </View>
                );
              })()}
          </>
        }
        ListFooterComponent={
          <Text className="text-outline font-inter-regular text-xs text-center mt-3">
            Continue estudando para desbloquear todas!
          </Text>
        }
      />
    </SafeAreaView>
  );
}
