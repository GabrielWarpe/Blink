import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useThemeColors';

/** Mesmo mínimo do cadastro — não faz sentido ser mais frouxo aqui. */
const MIN_PASSWORD = 6;

/**
 * Tela de nova senha, aberta pelo link do e-mail de recuperação.
 *
 * Quando ela aparece, a sessão de recuperação JÁ existe (o AuthContext captura
 * o deep link e chama `setSession`). O roteador segura o usuário aqui —
 * `recovering` impede que ele caia nas abas antes de trocar a senha.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { session, endRecovery, signOut } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    setError(null);
    if (password.length < MIN_PASSWORD) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : 'Não foi possível alterar a senha.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Desistiu: encerra a sessão de recuperação (ela dá acesso à conta) e volta
  // ao login. Sair sem isso deixaria a conta aberta sem senha nova.
  const handleCancel = async () => {
    endRecovery();
    await signOut();
    router.replace('/(auth)/login');
  };

  // O link ainda não virou sessão (ou expirou): não dá para trocar a senha.
  if (!session && !done) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-outline font-inter-regular text-sm text-center mt-4">
          Validando o link de recuperação…
        </Text>
        <Button
          variant="outline"
          size="lg"
          className="mt-8 w-full"
          onPress={handleCancel}
        >
          Voltar para o login
        </Button>
      </SafeAreaView>
    );
  }

  // ── Concluído ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <View
          className="w-16 h-16 rounded-card items-center justify-center mb-5"
          style={{ backgroundColor: colors.success + '22' }}
        >
          <Ionicons name="checkmark-circle" size={32} color={colors.success} />
        </View>
        <Text className="text-on-surface font-jakarta-bold text-2xl text-center">
          Senha alterada!
        </Text>
        <Text className="text-outline font-inter-regular text-sm text-center mt-2 leading-5">
          Sua nova senha já está valendo. Você continua conectado.
        </Text>
        <Button
          variant="primary"
          size="lg"
          className="mt-8 w-full"
          onPress={() => {
            // Libera o roteador: a partir daqui a sessão é normal.
            endRecovery();
            router.replace('/(tabs)');
          }}
        >
          Continuar
        </Button>
      </SafeAreaView>
    );
  }

  // ── Formulário ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            className="w-14 h-14 rounded-card items-center justify-center mb-5"
            style={{ backgroundColor: colors.primary + '22' }}
          >
            <Ionicons name="lock-open" size={28} color={colors.primary} />
          </View>
          <Text className="text-on-surface font-jakarta-extrabold text-3xl">
            Nova senha
          </Text>
          <Text className="text-outline font-inter-regular text-sm mt-1 mb-8 leading-5">
            Escolha uma senha nova para
            {session?.user.email != null ? ' ' : ' sua conta'}
            <Text className="text-on-surface font-inter-medium">
              {session?.user.email ?? ''}
            </Text>
            .
          </Text>

          <View className="gap-4">
            <Input
              label="Nova senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Mínimo de 6 caracteres"
              returnKeyType="next"
            />
            <Input
              label="Confirmar senha"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Repita a senha"
              returnKeyType="done"
              onSubmitEditing={() => void handleSave()}
              error={error ?? undefined}
            />
          </View>

          <Button
            variant="primary"
            size="lg"
            className="mt-8"
            loading={loading}
            onPress={() => void handleSave()}
          >
            Salvar nova senha
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="mt-2"
            onPress={() => void handleCancel()}
          >
            Cancelar
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
