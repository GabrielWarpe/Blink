import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { TabBar } from '@/components/TabBar';
import { TabBarIcon } from '@/components/TabBarIcon';
import { TabBarCollapseProvider } from '@/contexts/TabBarContext';

export default function TabsLayout() {
  const { profile } = useAuth();
  return (
    // O provider precisa envolver o <Tabs>: a barra e as telas roláveis são
    // ambas descendentes dele, e é por ele que a rolagem chega até a barra.
    <TabBarCollapseProvider>
      <Tabs
        // Barra própria (pílula de vidro flutuante). Todo o estilo do contêiner
        // e as animações vivem nos componentes; aqui ficam só as rotas, seus
        // ícones e seus rótulos.
        tabBar={props => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon icon="home" label="Início" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="decks"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon icon="albums" label="Decks" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon icon="earth" label="Comunidade" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                icon="stats-chart"
                label="Progresso"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                icon="person"
                label="Perfil"
                focused={focused}
                avatarUri={profile?.avatar_url}
              />
            ),
          }}
        />
      </Tabs>
    </TabBarCollapseProvider>
  );
}
