import { router, Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { FloatingTabBar, type IconName } from '@/design-system';
import { useGmailSync } from '@/features/inbox';

/** Label and icon per tab route; unknown routes fall back to their route name. */
const TAB_META: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Pipeline', icon: 'git-commit-outline' },
  inbox: { label: 'Inbox', icon: 'mail-outline' },
  prep: { label: 'Prep', icon: 'reader-outline' },
};

/** The floating tab bar, with "Add from a link" as its action button (B1). */
function AppTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const tabs = state.routes.map((route, index) => {
    const meta = TAB_META[route.name];
    const focused = index === state.index;
    return {
      key: route.key,
      label: meta?.label ?? route.name,
      icon: meta?.icon ?? 'ellipse-outline',
      focused,
      onPress: () => {
        const event = emitter.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (!focused && !event.defaultPrevented) navigateToTab(route.key);
      },
    };
  });
  return (
    <FloatingTabBar
      tabs={tabs}
      action={{
        icon: 'add',
        accessibilityLabel: 'Add from a link',
        onPress: () => router.push('/intake/new'),
      }}
    />
  );
}

/**
 * The tab screens. Focusing the Inbox tab reads new Gmail messages (INBX-8); triage and the other
 * reading triggers run app-wide from the root layout.
 */
export default function TabsLayout() {
  const { sync } = useGmailSync();
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Pipeline' }} />
      <Tabs.Screen
        name="inbox"
        options={{ title: 'Inbox' }}
        listeners={{ focus: () => void sync() }}
      />
      <Tabs.Screen name="prep" options={{ title: 'Prep' }} />
    </Tabs>
  );
}
