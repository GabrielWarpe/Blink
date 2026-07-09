import { Tabs } from 'expo-router';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import {
  TAB_ICON_SIZE,
  TAB_ICON_LABEL_GAP,
  TAB_LABEL_LINE,
  TAB_BAR_TOP_PAD,
  TAB_BAR_BOTTOM_PAD,
  TAB_BAR_HEIGHT,
} from '@/constants/layout';

interface TabIconProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  focused: boolean;
  label: string;
  /** Se presente, mostra a foto do usuário no lugar do ícone. */
  avatarUri?: string | null;
}

function TabIcon({ name, color, focused, label, avatarUri }: TabIconProps) {
  return (
    <View
      style={{
        width: 72,
        alignItems: 'center',
        justifyContent: 'center',
        gap: TAB_ICON_LABEL_GAP,
      }}
    >
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: focused ? 2 : 0,
            borderColor: color,
          }}
        />
      ) : (
        <Ionicons name={name} size={TAB_ICON_SIZE} color={color} />
      )}
      <Text
        numberOfLines={1}
        style={{
          color,
          fontSize: 11,
          lineHeight: TAB_LABEL_LINE,
          letterSpacing: 0.2,
          textAlign: 'center',
          // Medium (não Regular) no inativo: o peso 400 fica lavado no escuro.
          fontFamily: focused ? 'Inter_600SemiBold' : 'Inter_500Medium',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const colors = useThemeColors();
  const { profile } = useAuth();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          // Mesma cor da tela: a barra some no fundo, sem faixa nem degrau.
          backgroundColor: colors.background,
          borderTopWidth: 0,
          // Zera a moldura que cada plataforma desenha por conta própria,
          // senão a sombra do tab bar recria uma linha sutil no topo.
          elevation: 0,
          shadowOpacity: 0,
          shadowColor: 'transparent',
          // Altura = exatamente o conteúdo + folgas: nenhum vão sobrando.
          height: TAB_BAR_HEIGHT,
          paddingTop: TAB_BAR_TOP_PAD,
          paddingBottom: TAB_BAR_BOTTOM_PAD,
        },
        tabBarShowLabel: false,
        tabBarIconStyle: {
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'home' : 'home-outline'}
              color={color}
              focused={focused}
              label="Início"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="decks"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'albums' : 'albums-outline'}
              color={color}
              focused={focused}
              label="Decks"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              color={color}
              focused={focused}
              label="Progresso"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'person' : 'person-outline'}
              color={color}
              focused={focused}
              label="Perfil"
              avatarUri={profile?.avatar_url}
            />
          ),
        }}
      />
    </Tabs>
  );
}
