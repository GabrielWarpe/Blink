import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
  Share,
  TextInput,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { db } from '@/services/database';
import { deleteAccount } from '@/lib/api/deleteAccount';
import { ensureNotificationPermission } from '@/services/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { TimePickerRow } from '@/components/settings/TimePickerRow';
import {
  GOAL_MIN,
  GOAL_MAX,
  clampGoal,
  TIMER_LIMIT_STEPS,
  clampTimerLimit,
} from '@/constants/study';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
// Caixa de entrada do "Enviar feedback". É a conta DO APP, não a pessoal de
// ninguém: e-mail de aluno expira na formatura e vai embutido em toda cópia
// instalada, onde não dá para trocar sem publicar versão nova.
const FEEDBACK_EMAIL = 'blinkflashcards@gmail.com';

export default function SettingsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { settings, update } = useSettings();
  const colors = useThemeColors();

  /** Exclusão em curso — trava o botão para não disparar duas vezes. */
  const [deleting, setDeleting] = useState(false);

  // Meta diária vive no perfil (Supabase); editada inline aqui.
  const [dailyGoal, setDailyGoal] = useState('20');
  useEffect(() => {
    if (profile) setDailyGoal(String(profile.daily_goal));
  }, [profile]);

  const saveDailyGoal = async () => {
    if (!user) return;
    // Mesmo intervalo do slider do Perfil ([GOAL_MIN, GOAL_MAX]).
    const goal = clampGoal(parseInt(dailyGoal, 10));
    setDailyGoal(String(goal));
    await db.profile.update(user.id, { daily_goal: goal });
    await refreshProfile();
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const pickOption = (
    title: string,
    options: string[],
    onSelect: (o: string) => void,
  ) => {
    Alert.alert(title, undefined, [
      ...options.map(o => ({ text: o, onPress: () => onSelect(o) })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  // Ao ativar uma notificação, garante a permissão antes de salvar a opção.
  const toggleNotification = async (
    key: 'studyReminder' | 'streakAlert',
    value: boolean,
  ) => {
    if (value) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert(
          'Permissão necessária',
          'Ative as notificações do Blink nas configurações do sistema para receber lembretes.',
        );
        return;
      }
    }
    update(key, value);
  };

  const handleShare = () => {
    void Share.share({
      message:
        'Estude com flashcards e IA no Blink! Memorize qualquer coisa de forma inteligente. 🧠',
    }).catch(() => undefined);
  };

  const handleFeedback = async () => {
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
      `Feedback do Blink (v${APP_VERSION})`,
    )}`;
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Sem app de e-mail configurado: mostra o endereço para copiar à mão.
      Alert.alert(
        'Enviar feedback',
        `Nenhum app de e-mail encontrado. Escreva para:\n\n${FEEDBACK_EMAIL}`,
      );
    }
  };

  const handleAbout = () => {
    Alert.alert(
      'Blink',
      `Versão ${APP_VERSION}\n\nApp de flashcards com criação assistida por IA.\nFeito com Expo + Supabase.\n\nEmblemas de patentes e conquistas: game-icons.net (CC BY 3.0).`,
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  /**
   * Exclusão da conta, AQUI DENTRO — a Apple recusa app que manda o usuário
   * pedir isso por e-mail (diretriz 5.1.1(v)).
   *
   * Duas confirmações de propósito: a primeira diz o que se perde, a segunda
   * é o ponto sem volta. Ação destrutiva e irreversível não pode depender de
   * um toque só, ainda mais num link de texto que fica logo abaixo de "Sair".
   */
  const handleDeleteAccount = () => {
    if (deleting) return;
    Alert.alert(
      'Excluir conta',
      'Isto apaga para sempre o seu perfil, seus decks, seu histórico de estudo, o que você publicou na comunidade e os arquivos que enviou.\n\nNão há como desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Tem certeza?', 'Última confirmação.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Excluir minha conta',
                style: 'destructive',
                onPress: () => void confirmDeleteAccount(),
              },
            ]),
        },
      ],
    );
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    const result = await deleteAccount();
    setDeleting(false);
    if (!result.ok) {
      Alert.alert('Erro', result.message);
      return;
    }
    // Sem alerta de sucesso: `deleteAccount` já encerrou a sessão, então o
    // roteador leva para a tela de entrada. Um alerta em cima disso ficaria
    // órfão numa tela que o usuário não pediu para ver.
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-3 pt-2 pb-3 border-b border-outline-variant/15">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </TouchableOpacity>
          <Text className="flex-1 text-on-surface font-jakarta-bold text-lg ml-1">
            Configurações
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          // O campo da meta diária usa teclado numérico, que no iOS não
          // tem tecla de fechar: arrastar a página é a saída.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* ── Conta ── */}
          <SettingsSection title="Conta">
            <SettingsRow
              icon="person-circle"
              iconColor={colors.primary}
              title={profile?.name ?? 'Minha conta'}
              subtitle={user?.email ?? undefined}
            />
          </SettingsSection>

          {/* ── Estudo ── */}
          <SettingsSection title="Estudo">
            <SettingsRow
              icon="flag"
              title="Meta diária de cartões"
              subtitle={`Entre ${GOAL_MIN} e ${GOAL_MAX} cartões por dia`}
              rightSlot={
                <TextInput
                  value={dailyGoal}
                  onChangeText={setDailyGoal}
                  onEndEditing={() => void saveDailyGoal()}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  className="text-on-surface font-inter-semibold text-base w-14 text-right"
                  selectionColor={colors.primary}
                />
              }
            />
            <SettingsRow
              icon="shuffle"
              iconColor={colors.primary}
              title="Embaralhar cartões"
              toggle={{
                value: settings.shuffle,
                onValueChange: v => update('shuffle', v),
              }}
            />
            <SettingsRow
              icon="eye"
              title="Mostrar resposta automática"
              toggle={{
                value: settings.autoReveal,
                onValueChange: v => update('autoReveal', v),
              }}
            />
            {/* Cronômetro das sessões (todos os modos): este é o PADRÃO da conta.
                A tela de início permite mudar só para aquela sessão, sem tocar
                aqui. */}
            <SettingsRow
              icon="stopwatch"
              iconColor={colors.primary}
              title="Cronômetro"
              subtitle="Padrão ao iniciar uma sessão"
              toggle={{
                value: settings.studyTimer,
                onValueChange: v => update('studyTimer', v),
              }}
            />
            {settings.studyTimer && (
              <>
                <SettingsRow
                  icon="swap-vertical"
                  title="Modo do cronômetro"
                  value={
                    settings.studyTimerMode === 'down' ? 'Regressivo' : 'Crescente'
                  }
                  onPress={() =>
                    pickOption('Modo do cronômetro', ['Crescente', 'Regressivo'], o =>
                      update('studyTimerMode', o === 'Regressivo' ? 'down' : 'up'),
                    )
                  }
                />
                {settings.studyTimerMode === 'down' && (
                  <SettingsRow
                    icon="hourglass"
                    iconColor={colors.tertiary}
                    title="Tempo limite"
                    subtitle="O quiz encerra após a questão em tela"
                    value={`${settings.studyTimerMinutes} min`}
                    onPress={() =>
                      pickOption(
                        'Tempo limite',
                        TIMER_LIMIT_STEPS.map(m => `${m} min`),
                        o =>
                          update('studyTimerMinutes', clampTimerLimit(parseInt(o, 10))),
                      )
                    }
                  />
                )}
                <SettingsRow
                  icon="eye-off"
                  iconColor={colors.primary}
                  title="Mostrar o relógio"
                  subtitle="Oculto, o tempo continua sendo medido"
                  toggle={{
                    value: settings.studyTimerVisible,
                    onValueChange: v => update('studyTimerVisible', v),
                  }}
                />
              </>
            )}
          </SettingsSection>

          {/* ── Aparência ── */}
          <SettingsSection title="Aparência">
            <SettingsRow
              icon="contrast"
              iconColor={colors.primary}
              title="Tema"
              subtitle={
                settings.theme === 'Sistema'
                  ? `Sistema (${scheme === 'light' ? 'claro' : 'escuro'})`
                  : undefined
              }
              value={settings.theme}
              onPress={() =>
                pickOption('Tema', ['Claro', 'Escuro', 'Sistema'], v =>
                  update('theme', v),
                )
              }
            />
            <SettingsRow
              icon="text"
              title="Tamanho da fonte"
              value={settings.fontSize}
              onPress={() =>
                pickOption('Tamanho da fonte', ['Pequeno', 'Médio', 'Grande'], v =>
                  update('fontSize', v),
                )
              }
            />
          </SettingsSection>

          {/* ── Notificações ── */}
          <SettingsSection title="Notificações">
            <SettingsRow
              icon="notifications"
              title="Lembrete de estudo"
              subtitle={
                settings.studyReminder
                  ? `Só quando houver revisões, às ${settings.reminderTime}`
                  : undefined
              }
              toggle={{
                value: settings.studyReminder,
                onValueChange: v => void toggleNotification('studyReminder', v),
              }}
            />
            {settings.studyReminder && (
              <TimePickerRow
                value={settings.reminderTime}
                onChange={v => update('reminderTime', v)}
              />
            )}
            <SettingsRow
              icon="flame"
              title="Alerta de sequência"
              subtitle={settings.streakAlert ? 'Todos os dias às 21:00' : undefined}
              toggle={{
                value: settings.streakAlert,
                onValueChange: v => void toggleNotification('streakAlert', v),
              }}
            />
          </SettingsSection>

          {/* ── Feedback ── */}
          <SettingsSection title="Feedback">
            <SettingsRow
              icon="phone-portrait"
              iconColor={colors.primary}
              title="Feedback tátil (vibração)"
              subtitle="Vibra ao virar e avaliar os cartões durante o estudo"
              toggle={{
                value: settings.feedbackSounds,
                onValueChange: v => {
                  // Vibra na hora de ligar — confirmação tátil imediata de que
                  // o recurso está funcionando, sem precisar entrar no estudo.
                  if (v) {
                    void Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success,
                    );
                  }
                  update('feedbackSounds', v);
                },
              }}
            />
          </SettingsSection>

          {/* ── Acessibilidade ── */}
          <SettingsSection title="Acessibilidade">
            <SettingsRow
              icon="pause-circle"
              title="Reduzir animações"
              toggle={{
                value: settings.reduceMotion,
                onValueChange: v => update('reduceMotion', v),
              }}
            />
            <SettingsRow
              icon="hand-left"
              title="Gestos de swipe"
              subtitle="Desligado: avalie só pelos botões"
              toggle={{
                value: settings.swipeGestures,
                onValueChange: v => update('swipeGestures', v),
              }}
            />
          </SettingsSection>

          {/* ── App ── */}
          <SettingsSection title="App">
            <SettingsRow
              icon="share-social"
              iconColor={colors.primary}
              title="Compartilhar app"
              onPress={handleShare}
            />
            <SettingsRow
              icon="chatbox-ellipses"
              title="Enviar feedback"
              subtitle="Abre seu app de e-mail"
              onPress={handleFeedback}
            />
            <SettingsRow
              icon="information-circle"
              title="Sobre"
              value={`v${APP_VERSION}`}
              onPress={handleAbout}
            />
          </SettingsSection>

          {/* ── Footer ── */}
          <View className="gap-4 mt-2">
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.8}
              className="bg-error/15 rounded-card py-3.5 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
              <Text className="text-error font-inter-semibold text-base">
                Sair da conta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="Excluir conta permanentemente"
              className="items-center"
            >
              <Text className="text-outline font-inter-regular text-sm underline">
                {deleting ? 'Excluindo...' : 'Excluir conta'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-outline font-inter-regular text-xs text-center mt-6">
            Blink v{APP_VERSION}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
