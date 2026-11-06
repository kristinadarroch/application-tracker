import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useTheme, type IconName } from '@/design-system';

function TabIcon({ name, focused, size }: { name: IconName; focused: boolean; size: number }) {
  const theme = useTheme();
  return (
    <Ionicons
      name={name}
      size={size}
      color={focused ? theme.color.text.link : theme.color.text.secondary}
    />
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.text.link,
        tabBarInactiveTintColor: theme.color.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.color.bg.surface,
          borderTopColor: theme.color.border.subtle,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pipeline',
          tabBarIcon: (props) => <TabIcon name="albums-outline" {...props} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: (props) => <TabIcon name="mail-outline" {...props} />,
        }}
      />
      <Tabs.Screen
        name="prep"
        options={{
          title: 'Prep',
          tabBarIcon: (props) => <TabIcon name="school-outline" {...props} />,
        }}
      />
    </Tabs>
  );
}
