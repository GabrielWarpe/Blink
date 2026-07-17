import { useState, useCallback, useRef, useEffect } from 'react';
import type { Flashcard, Deck, Grade, StudyPhase, StudyMode } from '@/types';
import { reviewCard } from '@/services/ai';
import { db } from '@/services/database';
import { sessionAccuracy } from '@/utils/stats';
import { prefetchCardImages } from '@/services/images';
import {
  fireStreakNotification,
  syncReminders,
} from '@/services/notifications';
import {
  checkAchievements,
  buildAchievementStats,
} from '@/services/achievements';
import { useActiveTimer } from '@/hooks/useActiveTimer';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';

/** Um passo desfeito pelo "voltar": tudo que é preciso para restaurar o estado. */
interface HistoryEntry {
  /** O card ANTES da revisão — regravá-lo reverte o agendamento SM-2. */
  card: Flashcard;
  queue: Flashcard[];
  correctCount: number;
  againCount: number;
  skippedCount: number;
  done: number;
  outcome: 'correct' | 'wrong' | 'skip';
}

/**
 * Sessão de estudo com fila e UMA PASSADA por card (estilo NotebookLM).
 *
 * Cada card aparece uma vez e vira um de três desfechos: Entendi
 * (`correctCount`), Não deu (`againCount`) ou Pulou (`skippedCount`). Os três
 * somam o total, e `done` conta quantos já foram processados. "Não deu" não
 * reaparece na sessão, mas o SM-2 o reagenda para outro dia normalmente.
 */
export function useStudySession(deck: Deck | null, mode: StudyMode = 'flash') {
  const { user, refreshProfile } = useAuth();
  const { settings } = useSettings();
  const [phase, setPhase] = useState<StudyPhase>('idle');
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [correctCount, setCorrectCount] = useState(0); // Entendi
  const [againCount, setAgainCount] = useState(0); // Não deu
  const [skippedCount, setSkippedCount] = useState(0); // Pulou
  // Cards que não foram "Entendi" (errou ou pulou) — base do "praticar as que
  // não entendi".
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  // Pilha de respostas dadas, para o "voltar" desfazer.
  const historyRef = useRef<HistoryEntry[]>([]);
  const startTimeRef = useRef<number>(0);
  // Tempo REAL de resolução (pausa em segundo plano). É o que vai para
  // `active_seconds` — o intervalo started_at→ended_at contaria o app
  // minimizado como se fosse estudo.
  const timer = useActiveTimer();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // Encerrar assim que o card em tela for resolvido (tempo esgotado no quiz).
  // É um ref, não estado: quem decide é o `grade`/`skip` do MESMO tique, com os
  // contadores já calculados — ler um estado aqui pegaria o valor anterior.
  const endAfterCurrentRef = useRef(false);

  // Ancoragem: acurácia da ÚLTIMA sessão passada deste deck, capturada quando o
  // deck fica disponível — antes de a sessão atual ser gravada, então ela não
  // se auto-compara. `null` = deck sem sessão anterior (primeira vez → sem
  // âncora, honesto). O resultado mostra o delta contra este valor.
  const [priorAccuracy, setPriorAccuracy] = useState<number | null>(null);
  useEffect(() => {
    if (!deck || !user) return;
    let cancelled = false;
    void db.sessions.getByDeck(deck.id, deck.title, 1).then(prev => {
      if (cancelled) return;
      setPriorAccuracy(prev[0] ? sessionAccuracy(prev[0]) : null);
    });
    return () => {
      cancelled = true;
    };
  }, [deck?.id, user?.id]);

  const start = useCallback(
    (studyCards: Flashcard[]) => {
      const ordered = settings.shuffle
        ? [...studyCards].sort(() => Math.random() - 0.5)
        : [...studyCards];
      // Baixa as imagens da sessão de antemão: quando o card chegar ao topo
      // da fila, ela já está no cache do expo-image e aparece na hora.
      prefetchCardImages(ordered);
      setQueue(ordered);
      setTotal(ordered.length);
      setDone(0);
      setCorrectCount(0);
      setAgainCount(0);
      setSkippedCount(0);
      setWrongIds(new Set());
      historyRef.current = [];
      setPhase('studying');
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      endAfterCurrentRef.current = false;
      timer.start();
    },
    [settings.shuffle, timer],
  );

  /**
   * Pede para encerrar a sessão assim que o card em tela for resolvido. Nada é
   * descartado: o que já foi concluído conta normalmente. Usado quando o tempo
   * do quiz regressivo esgota — a questão aberta não é arrancada da mão.
   */
  const requestFinish = useCallback(() => {
    endAfterCurrentRef.current = true;
  }, []);

  // Encerra a sessão gravando o registro (só se algum card foi concluído).
  const finalize = useCallback(
    (reviewed: number, correct: number, again: number) => {
      // Para o cronômetro antes de qualquer await: o tempo é o da resolução,
      // não o da gravação.
      const activeSeconds = timer.stop();
      setElapsedSeconds(activeSeconds);

      if (deck && user && reviewed > 0) {
        const startedAt = new Date(startTimeRef.current).toISOString();
        void (async () => {
          await db.sessions.create({
            user_id: user.id,
            playlist_id: deck.id,
            started_at: startedAt,
            ended_at: new Date().toISOString(),
            cards_reviewed: reviewed,
            correct_count: correct,
            // A avaliação virou binária: 'Difícil' não existe mais. A coluna
            // fica (sessões antigas a usam), sempre zerada nas novas.
            hard_count: 0,
            again_count: again,
            mode,
            active_seconds: activeSeconds,
          });
          await db.decks.touchStudied(deck.id);

          const before = await db.profile.get(user.id);
          const after = await db.profile.updateStreak(user.id);
          await refreshProfile();

          if (
            settings.streakAlert &&
            after &&
            before &&
            after.current_streak > before.current_streak
          ) {
            await fireStreakNotification(after.current_streak);
          }

          // Janela de 2000 sessões: precisa cobrir os maiores limiares das
          // conquistas (500 sessões, 10.000 cards) — 365 era pouco e tornava
          // os degraus altos inalcançáveis.
          const sessions = await db.sessions.getRecent(user.id, 2000);
          const allDecks = await db.decks.getAll(user.id);
          const [leeches, retentionDays] = await Promise.all([
            db.reviews.getLeeches(user.id),
            db.reviews.getRetentionByDay(user.id, 30),
          ]);
          // Leech domado = card que acumulou 4+ "De novo" e hoje está dominado.
          const masteredIds = new Set(
            allDecks.flatMap(d => d.cards.filter(c => c.mastered).map(c => c.id)),
          );
          const leechesTamed = leeches.filter(l =>
            masteredIds.has(l.cardId),
          ).length;
          const retention30 = retentionDays.reduce(
            (acc, day) => ({
              total: acc.total + day.total,
              retained: acc.retained + day.retained,
            }),
            { total: 0, retained: 0 },
          );
          await checkAchievements(
            user.id,
            buildAchievementStats({
              sessions,
              decks: allDecks,
              currentStreak: after?.current_streak ?? 0,
              longestStreak: after?.longest_streak ?? 0,
              leechesTamed,
              retention30,
            }),
          );

          // Reagenda os lembretes com as contagens pós-sessão: cards recém
          // revisados deixam de estar "devidos" nos próximos dias.
          await syncReminders({
            studyReminder: settings.studyReminder,
            reminderTime: settings.reminderTime,
            streakAlert: settings.streakAlert,
            userId: user.id,
          });
        })();
      }
      setPhase('finished');
    },
    [
      deck,
      user,
      mode,
      timer,
      refreshProfile,
      settings.streakAlert,
      settings.studyReminder,
      settings.reminderTime,
    ],
  );

  /**
   * Responde o card do topo: acertou ou errou. Só existem estes dois níveis.
   *
   * O agendamento SM-2 continua vivo, com o mapeamento mínimo: errar equivale a
   * "De novo" (o card volta amanhã E reaparece no fim desta sessão) e acertar
   * equivale a "Bom" (o intervalo cresce). Os antigos "Difícil"/"Fácil" saíram
   * da interface e não são mais gravados.
   */
  const answer = useCallback(
    (correct: boolean) => {
      if (!deck || !user) return;
      const card = queue[0];
      if (!card) return;

      const g: Grade = correct ? 'good' : 'again';
      const updated = reviewCard(card, g);
      void db.decks.reviewCard(updated);
      void db.reviews.log({
        user_id: user.id,
        card_id: card.id,
        playlist_id: deck.id,
        grade: g,
        interval_before: card.interval,
        interval_after: updated.interval,
      });

      // Uma passada: cada card é processado uma vez e sai da fila. "Não deu"
      // NÃO reaparece nesta sessão (mas o SM-2 acima já o reagenda para outro
      // dia). Assim Entendi + Não deu + Pulou somam o total, como no NotebookLM.
      const nextQueue = queue.slice(1);

      // "Não entendi" (errou) entra no conjunto do "praticar as que não entendi".
      if (!correct) {
        setWrongIds(prev => {
          const next = new Set(prev);
          next.add(card.id);
          return next;
        });
      }

      const nextCorrect = correctCount + (correct ? 1 : 0);
      const nextAgain = againCount + (correct ? 0 : 1);
      const nextDone = done + 1;

      historyRef.current.push({
        card,
        queue,
        correctCount,
        againCount,
        skippedCount,
        done,
        outcome: correct ? 'correct' : 'wrong',
      });

      setCorrectCount(nextCorrect);
      setAgainCount(nextAgain);
      setDone(nextDone);
      setQueue(nextQueue);

      if (nextQueue.length === 0 || endAfterCurrentRef.current) {
        // Gravado = respondidos (Entendi + Não deu); pulados não são revisão.
        finalize(nextCorrect + nextAgain, nextCorrect, nextAgain);
      }
    },
    [deck, user, queue, correctCount, againCount, skippedCount, done, finalize],
  );

  /**
   * Volta ao card anterior, desfazendo o desfecho: restaura fila e contadores,
   * e — se foi uma resposta (não um pulo) — reverte o agendamento SM-2 e apaga
   * o registro da revisão, senão ela continuaria pesando na retenção.
   */
  const back = useCallback(() => {
    if (!user) return;
    const prev = historyRef.current.pop();
    if (!prev) return;

    if (prev.outcome !== 'skip') {
      void db.decks.reviewCard(prev.card); // reverte o SM-2 ao estado anterior
      void db.reviews.undoLast(user.id, prev.card.id);
    }
    if (prev.outcome !== 'correct') {
      setWrongIds(w => {
        const n = new Set(w);
        n.delete(prev.card.id);
        return n;
      });
    }

    setQueue(prev.queue);
    setCorrectCount(prev.correctCount);
    setAgainCount(prev.againCount);
    setSkippedCount(prev.skippedCount);
    setDone(prev.done);
  }, [user]);

  const canGoBack = historyRef.current.length > 0;

  // Pula o card do topo: conta como "Pulou" e sai da fila (uma passada).
  const skip = useCallback(() => {
    const card = queue[0];
    const rest = queue.slice(1);
    if (card) {
      setWrongIds(prev => {
        const next = new Set(prev);
        next.add(card.id);
        return next;
      });
      historyRef.current.push({
        card,
        queue,
        correctCount,
        againCount,
        skippedCount,
        done,
        outcome: 'skip',
      });
      setSkippedCount(skippedCount + 1);
      setDone(done + 1);
    }
    setQueue(rest);
    if (rest.length === 0 || endAfterCurrentRef.current) {
      finalize(correctCount + againCount, correctCount, againCount);
    }
  }, [queue, done, correctCount, againCount, skippedCount, finalize]);

  const reset = useCallback(() => {
    setPhase('idle');
    setQueue([]);
    setTotal(0);
    setDone(0);
    setCorrectCount(0);
    setAgainCount(0);
    setSkippedCount(0);
    setWrongIds(new Set());
    historyRef.current = [];
    setElapsedSeconds(0);
    endAfterCurrentRef.current = false;
  }, []);

  const currentCard = phase === 'studying' ? (queue[0] ?? null) : null;

  return {
    phase,
    currentCard,
    done,
    total,
    correctCount,
    againCount,
    /** Cards pulados nesta sessão (o "Pulou" do resultado). */
    skippedCount,
    /** Ids que não foram "Entendi" (errou ou pulou) — base do "refazer". */
    wrongIds,
    /** Tempo final da sessão (só preenchido depois de terminar). */
    elapsedSeconds,
    /** Acurácia da última sessão passada do deck (ancoragem); null se 1ª vez. */
    priorAccuracy,
    /** Tem resposta anterior para desfazer? */
    canGoBack,
    /** Lê o tempo corrente sem re-renderizar — para o relógio da tela. */
    getElapsed: timer.getElapsed,
    start,
    /** Resposta binária: true = acertei, false = errei. */
    answer,
    /** Desfaz a última resposta e volta ao card anterior. */
    back,
    skip,
    requestFinish,
    reset,
  };
}
