import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { ThemeProvider, useTheme } from '@/design-system';
import { useAiAvailabilitySync } from '@/features/capabilities/useAiAvailabilitySync';
import { selectThemePreference } from '@/features/settings/slice';
import { useAppSelector } from '@/store/hooks';
import { persistor, store } from '@/store/store';

function ThemedApp({ children }: { children: ReactNode }) {
  const preference = useAppSelector(selectThemePreference);
  useAiAvailabilitySync();
  return <ThemeProvider preference={preference}>{children}</ThemeProvider>;
}

function Navigator() {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.color.bg.canvas },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={null}>
        <ThemedApp>
          <Navigator />
        </ThemedApp>
      </PersistGate>
    </Provider>
  );
}
