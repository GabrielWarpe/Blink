import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { pickAvatar as pickProfilePhoto, uploadAvatar } from '@/services/images';
import { db } from '@/services/database';
import { ensureNotificationPermission } from '@/services/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useStreak } from '@/hooks/useStreak';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { GoalSlider } from '@/components/GoalSlider';
import { Card, cardShadow } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { useGlassEdge, GlassSheen } from '@/components/ui/GlassSurface';
import { ACHIEVEMENTS, getUnlocked } from '@/services/achievements';
import { GOAL_MIN, GOAL_MAX } from '@/constants/study';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { settings, update } = useSettings();
  const { streak } = useStreak();
  const colors = useThemeColors();
  const edge = useGlassEdge();
  const tabBar = useTabBarInset();
  const tabScroll = useTabBarScroll();

  const name = profile?.name ?? 'Estudante';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : null;

  // Meta diária editada pelo slider; persiste no perfil ao soltar.
  const [goal, setGoal] = useState(profile?.daily_goal ?? 20);
  useEffect(() => {
    if (profile) setGoal(profile.daily_goal);
  }, [profile]);

  const commitGoal = async (v: number) => {
    if (!user) return;
    await db.profile.update(user.id, { daily_goal: v });
    await refreshProfile();
  };

  // ── Edição de nome ─────────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const openEditName = () => {
    setNameDraft(profile?.name ?? '');
    setEditingName(true);
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!user || trimmed.length === 0) {
      setEditingName(false);
      return;
    }
    try {
      await db.profile.update(user.id, { name: trimmed });
      await refreshProfile();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o nome.');
    }
    setEditingName(false);
  };

  // ── Troca de foto ──────────────────────────────────────────────────────────
  const [savingAvatar, setSavingAvatar] = useState(false);

  const pickAvatar = async () => {
    if (!user || savingAvatar) return;
    // No iOS a galeria usa o PHPicker (não exige permissão de biblioteca).
    const picked = await pickProfilePhoto();
    if (!picked) return;

    setSavingAvatar(true);
    try {
      // Storage, não data URI no banco: o avatar é copiado para cada deck
      // publicado e cada avaliação, e a aba Comunidade lê 100 linhas de uma
      // vez — guardá-lo dentro da linha multiplicava o egress. Ver
      // `pickAvatar`/`uploadAvatar` em `services/images`.
      const url = await uploadAvatar(user.id, picked);
      await db.profile.update(user.id, { avatar_url: url });
      await refreshProfile();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a foto.');
    } finally {
      setSavingAvatar(false);
    }
  };

  /** Volta ao bonequinho: `avatar_url` é anulável, então basta limpar. */
  const removeAvatar = async () => {
    if (!user || savingAvatar) return;
    setSavingAvatar(true);
    try {
      await db.profile.update(user.id, { avatar_url: null });
      await refreshProfile();
    } catch {
      Alert.alert('Erro', 'Não foi possível remover a foto.');
    } finally {
      setSavingAvatar(false);
    }
  };

  /**
   * Toque no avatar. Com foto, abre o menu (trocar / remover); sem foto, vai
   * direto à galeria — um menu de uma opção só seria um toque a mais por nada.
   */
  const handleAvatarPress = () => {
    if (savingAvatar) return;
    if (!profile?.avatar_url) {
      void pickAvatar();
      return;
    }
    Alert.alert('Foto de perfil', undefined, [
      { text: 'Escolher outra foto', onPress: () => void pickAvatar() },
      {
        text: 'Remover foto',
        style: 'destructive',
        onPress: () => void removeAvatar(),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // Cards dominados + conquistas; recarrega ao focar a aba.
  const [mastered, setMastered] = useState(0);
  const [achievementsCount, setAchievementsCount] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      void db.flashcards.countMastered(user.id).then(setMastered);
      void getUnlocked(user.id).then(ids => setAchievementsCount(ids.length));
    }, [user]),
  );

  const toggleNotifications = async (value: boolean) => {
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
    update('studyReminder', value);
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <ScrollView
        {...tabScroll}
        contentContainerStyle={{ padding: 20, paddingBottom: tabBar.contentInset }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — único acesso às configurações */}
        <View className="flex-row items-center justify-between mb-8">
          <Text
            className="text-on-surface font-jakarta-extrabold text-3xl"
            style={{ letterSpacing: -0.5 }}
          >
            Perfil
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            className="w-10 h-10 items-center justify-center rounded-button bg-surface-container"
            style={cardShadow}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={20} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Avatar + nome */}
        <View className="items-center">
          <TouchableOpacity
            onPress={handleAvatarPress}
            activeOpacity={0.85}
            disabled={savingAvatar}
            accessibilityRole="button"
            accessibilityLabel={
              profile?.avatar_url
                ? 'Trocar ou remover a foto de perfil'
                : 'Escolher uma foto de perfil'
            }
            className="relative"
          >
            {/* Sem anel em volta e sem inicial: com foto, ela aparece sozinha;
                sem foto, o bonequinho — o mesmo glifo da barra de abas, para o
                usuário sem avatar ver a MESMA coisa nos dois lugares. */}
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-surface-container items-center justify-center">
                <Ionicons name="person" size={48} color={colors.outline} />
              </View>
            )}
            {/* Badge de câmera */}
            <View
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-container items-center justify-center"
              style={{ borderWidth: 2, borderColor: colors.background }}
            >
              <Ionicons
                name="camera"
                size={15}
                color={colors.onPrimaryContainer}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openEditName}
            activeOpacity={0.7}
            className="flex-row items-center gap-1.5 mt-4"
          >
            <Text className="text-on-surface font-jakarta-extrabold text-2xl">
              {name}
            </Text>
            <Ionicons name="pencil" size={16} color={colors.outline} />
          </TouchableOpacity>
          {memberSince != null && (
            <Text className="text-outline font-inter-medium text-sm mt-1">
              Membro desde {memberSince}
            </Text>
          )}
        </View>

        {/* Stat tiles */}
        <View className="flex-row gap-4 mt-8">
          <Card className="flex-1 p-5 items-center">
            <Ionicons name="flame" size={28} color={colors.tertiary} />
            <Text className="text-on-surface font-jakarta-extrabold text-3xl mt-2">
              {streak}
            </Text>
            <Text className="text-on-surface-variant font-inter-regular text-xs mt-1">
              Dias de sequência
            </Text>
          </Card>
          <Card className="flex-1 p-5 items-center">
            <Ionicons name="medal" size={28} color={colors.primary} />
            <Text className="text-on-surface font-jakarta-extrabold text-3xl mt-2">
              {mastered}
            </Text>
            <Text className="text-on-surface-variant font-inter-regular text-xs mt-1">
              Cards dominados
            </Text>
          </Card>
        </View>

        {/* Meta diária */}
        <Card className="p-5 mt-4">
          <View className="flex-row items-end justify-between">
            <Text className="text-on-surface font-jakarta-bold text-xl">
              Meta diária
            </Text>
            <Text className="text-primary font-jakarta-extrabold text-2xl">
              {goal}
              <Text className="text-primary font-inter-regular text-sm"> cards</Text>
            </Text>
          </View>
          <View className="mt-3">
            <GoalSlider
              value={goal}
              min={GOAL_MIN}
              max={GOAL_MAX}
              onChange={setGoal}
              onCommit={v => void commitGoal(v)}
              trackColor={colors.surfaceContainerHighest}
              fillColor={colors.primary}
              thumbColor={colors.primary}
            />
          </View>
          <View className="flex-row justify-between">
            <Text className="text-outline font-inter-regular text-xs">
              {GOAL_MIN}
            </Text>
            <Text className="text-outline font-inter-medium text-xs">Casual</Text>
            <Text className="text-outline font-inter-medium text-xs">Intenso</Text>
            <Text className="text-outline font-inter-regular text-xs">
              {GOAL_MAX}
            </Text>
          </View>
        </Card>

        {/* Notificações push */}
        <Card className="flex-row items-center gap-3 px-4 py-3.5 mt-4">
          <View className="w-10 h-10 rounded-button items-center justify-center bg-surface-container-high">
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-on-surface font-inter-medium text-[15px]">
              Notificações push
            </Text>
            <Text className="text-outline font-inter-regular text-xs mt-0.5">
              Lembrete diário de estudo
            </Text>
          </View>
          <Toggle
            value={settings.studyReminder}
            onValueChange={v => void toggleNotifications(v)}
          />
        </Card>

        {/* Conquistas */}
        <TouchableOpacity
          onPress={() => router.push('/achievements')}
          activeOpacity={0.8}
          className="flex-row items-center gap-3 px-4 py-3.5 bg-surface-container rounded-card mt-4"
          style={[cardShadow, edge]}
        >
          <GlassSheen />
          <View className="w-10 h-10 rounded-button items-center justify-center bg-surface-container-high">
            <Ionicons name="trophy-outline" size={20} color={colors.tertiary} />
          </View>
          <View className="flex-1">
            <Text className="text-on-surface font-inter-medium text-[15px]">
              Conquistas
            </Text>
            <Text className="text-outline font-inter-regular text-xs mt-0.5">
              {achievementsCount} de {ACHIEVEMENTS.length} desbloqueadas
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.outline} />
        </TouchableOpacity>

        {/* Sair */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="items-center mt-8"
          activeOpacity={0.7}
        >
          <Text className="text-error font-inter-semibold text-base">
            Sair da conta
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal: editar nome */}
      <Modal
        visible={editingName}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingName(false)}
      >
        {/* O KeyboardAvoidingView tem de ficar DENTRO do Modal: ele é uma
            janela própria, então um wrapper na tela por baixo não alcança o
            diálogo. Sem isto, num aparelho menor o teclado cobre o campo. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 items-center justify-center px-8 bg-black/50"
        >
          <View className="w-full bg-surface-container-high rounded-card p-5">
            <Text className="text-on-surface font-jakarta-bold text-lg mb-3">
              Editar nome
            </Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Seu nome"
              placeholderTextColor={colors.outline}
              autoFocus
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={() => void saveName()}
              className="bg-surface-container rounded-button px-4 py-3 text-on-surface font-inter-regular text-base"
              selectionColor={colors.primary}
            />
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => setEditingName(false)}
                activeOpacity={0.8}
                className="flex-1 py-3 rounded-button items-center bg-surface-container"
              >
                <Text className="text-outline font-inter-semibold">
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void saveName()}
                activeOpacity={0.8}
                className="flex-1 py-3 rounded-button items-center bg-primary-container"
              >
                <Text className="text-on-primary-container font-inter-semibold">
                  Salvar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
