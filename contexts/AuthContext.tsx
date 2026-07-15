import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { db } from '@/services/database';
import type { Profile } from '@/types/db';

/** Rota que recebe o link de redefinição de senha. */
export const RESET_PASSWORD_PATH = '/reset-password';

/**
 * URL de retorno do e-mail de recuperação. É CALCULADA, não escrita à mão: no
 * Expo Go vira `exp://192.168.x.x/--/reset-password`, e no app instalado vira
 * `recall://reset-password` (o `scheme` do app.json). Um valor fixo só
 * funcionaria num dos dois.
 */
export function resetRedirectUrl(): string {
  return Linking.createURL(RESET_PASSWORD_PATH);
}

/**
 * Extrai os tokens do link de recuperação. O Supabase devolve no fragmento
 * (`#access_token=…&refresh_token=…&type=recovery`), mas alguns fluxos usam a
 * query — então olhamos os dois.
 */
function parseRecoveryLink(
  url: string,
): { accessToken: string; refreshToken: string } | null {
  const [, fragment] = url.split('#');
  const query = url.split('?')[1]?.split('#')[0];
  const params = new URLSearchParams(fragment ?? query ?? '');
  if (params.get('type') !== 'recovery') return null;
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  /** true só após um login/registro real (evento SIGNED_IN), não numa sessão
   * restaurada ao abrir o app. Usado para disparar o onboarding na hora certa. */
  freshLogin: boolean;
  /** true enquanto o usuário veio de um link de redefinição de senha. Segura o
   * roteador na tela de nova senha (a sessão existe, mas ele NÃO deve cair nas
   * abas nem no onboarding antes de trocar a senha). */
  recovering: boolean;
  /** Chamado pela tela de nova senha ao concluir (ou desistir). */
  endRecovery: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  /** Retorna true se a sessão já foi criada (confirmação de e-mail desativada). */
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [freshLogin, setFreshLogin] = useState(false);
  const [recovering, setRecovering] = useState(false);

  async function fetchProfile(userId: string) {
    const data = await db.profile.get(userId);
    if (data) setProfile(data);
  }

  // Link de redefinição de senha. O cliente Supabase roda com
  // `detectSessionInUrl: false` (correto no nativo), então ninguém lê a URL por
  // nós: capturamos o link, criamos a sessão de recuperação à mão e marcamos
  // `recovering` para o roteador segurar o usuário na tela de nova senha.
  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url) return;
      const tokens = parseRecoveryLink(url);
      if (!tokens) return;
      setRecovering(true);
      void supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
    };

    // App aberto DO ZERO pelo link (estava fechado).
    void Linking.getInitialURL().then(handle);
    // App já estava aberto em segundo plano.
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) void fetchProfile(session.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) void fetchProfile(session.user.id);
      else setProfile(null);
      // SIGNED_IN = login/registro de verdade → habilita o onboarding.
      // INITIAL_SESSION/TOKEN_REFRESHED (reabertura) NÃO disparam.
      if (event === 'SIGNED_IN') setFreshLogin(true);
      else if (event === 'SIGNED_OUT') setFreshLogin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    return data.session != null;
  }

  async function signOut() {
    setRecovering(false);
    await supabase.auth.signOut();
  }

  async function sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirectUrl(),
    });
    if (error) throw error;
  }

  function endRecovery() {
    setRecovering(false);
  }

  async function refreshProfile() {
    if (session) await fetchProfile(session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        freshLogin,
        recovering,
        endRecovery,
        signIn,
        signUp,
        signOut,
        sendPasswordReset,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
