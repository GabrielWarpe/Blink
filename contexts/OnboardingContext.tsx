import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

/**
 * Controla a experiência de primeira execução. A flag é POR CONTA (chave por
 * user id) e vive no dispositivo: assim toda conta nova — logo após o registro
 * — vê o onboarding uma vez, e contas que já viram não o repetem. É local de
 * propósito (não sincroniza entre aparelhos); é sobre apresentar o app, não um
 * dado sensível da conta.
 */

const KEY_PREFIX = 'recall_onboarding_done_';

interface OnboardingContextType {
  /** `null` enquanto carrega a flag do usuário atual; depois `true`/`false`. */
  done: boolean | null;
  complete: () => void;
}

const OnboardingContext = createContext<OnboardingContextType>({
  done: null,
  complete: () => undefined,
});

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    // Sem usuário (deslogado): resolve como "visto" para não travar o gate de
    // carregamento — o onboarding só é relevante com sessão ativa.
    if (!user) {
      setDone(true);
      return;
    }
    let active = true;
    setDone(null); // carregando a flag desta conta
    void AsyncStorage.getItem(KEY_PREFIX + user.id).then(v => {
      if (active) setDone(v === '1');
    });
    return () => {
      active = false;
    };
  }, [user]);

  const complete = useCallback(() => {
    setDone(true);
    if (user) void AsyncStorage.setItem(KEY_PREFIX + user.id, '1');
  }, [user]);

  return (
    <OnboardingContext.Provider value={{ done, complete }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
