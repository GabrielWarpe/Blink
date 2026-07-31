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
        // Barra própria (largura cheia, opaca, colada no fundo). Todo o estilo
        // do contêiner e as animações vivem nos componentes; aqui ficam só as
        // rotas e seus ícones.
        //
        // `tabBarAccessibilityLabel` em TODAS: a barra não tem mais rótulo
        // visível, então este texto é a única forma de um leitor de tela saber
        // o que é cada aba. Sem ele, VoiceOver/TalkBack anunciariam só "botão".
        tabBar={props => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarAccessibilityLabel: 'Início',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon icon="home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="decks"
          options={{
            tabBarAccessibilityLabel: 'Decks',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon icon="albums" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            tabBarAccessibilityLabel: 'Comunidade',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon icon="earth" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            tabBarAccessibilityLabel: 'Progresso',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon icon="stats-chart" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarAccessibilityLabel: 'Perfil',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                icon="person"
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
