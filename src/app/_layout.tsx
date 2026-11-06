import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { Button, Screen, Text, ThemeProvider, useTheme } from '@/design-system';
import { useAiAvailabilitySync } from '@/features/capabilities/useAiAvailabilitySync';
import { selectThemePreference } from '@/features/settings/slice';
import { useAppSelector } from '@/store/hooks';
import { persistor, store } from '@/store/appStore';

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

/**
 * Recovery screen for render crashes anywhere in the app (UX-5). Expo Router renders it in place
 * of the root layout, so it mounts its own providers. Persisted data is never touched.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    if (__DEV__) console.error(error);
  }, [error]);
  return (
    <Provider store={store}>
      <ThemedApp>
        <Screen title="Something went wrong" scroll>
          <Text>
            This screen couldn’t be shown. Your applications, drafts, and settings are still saved
            on this device.
          </Text>
          {__DEV__ ? (
            <Text variant="caption" color="secondary">
              {error.message}
            </Text>
          ) : null}
          <Button label="Try again" icon="refresh" onPress={() => void retry()} />
        </Screen>
      </ThemedApp>
    </Provider>
  );
}
