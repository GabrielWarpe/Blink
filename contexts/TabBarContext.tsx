import React, { createContext, useContext } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

/**
 * Quanto a barra de abas está encolhida: 0 = normal, 1 = só ícones.
 *
 * É um SharedValue do Reanimated, não estado do React, de propósito: a rolagem
 * o atualiza a cada frame na thread de UI e a barra o lê ali mesmo. Com
 * `useState` cada frame de rolagem re-renderizaria as 5 abas e as telas todas.
 * Como o valor é um objeto estável, o contexto nunca muda de identidade e
 * ninguém re-renderiza por causa dele.
 */
const TabBarCollapseContext = createContext<SharedValue<number> | null>(null);

export function TabBarCollapseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const collapsed = useSharedValue(0);
  return (
    <TabBarCollapseContext.Provider value={collapsed}>
      {children}
    </TabBarCollapseContext.Provider>
  );
}

export function useTabBarCollapse(): SharedValue<number> {
  const value = useContext(TabBarCollapseContext);
  if (!value) {
    throw new Error(
      'useTabBarCollapse precisa estar dentro de <TabBarCollapseProvider> (app/(tabs)/_layout.tsx).',
    );
  }
  return value;
}
