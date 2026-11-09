import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import TabsLayout from '@/app/(tabs)/_layout';
import PipelineRoute from '@/app/(tabs)/index';
import ApplicationDetailRoute from '@/app/application/[id]/index';
import EditApplicationRoute from '@/app/application/[id]/edit';
import NewApplicationRoute from '@/app/application/new';
import MessageRoute from '@/app/inbox/[messageId]';
import SettingsRoute from '@/app/settings';
import { Text, ThemeProvider } from '@/design-system';
import { useEmailReading } from '@/features/inbox';
import { makeStore, type RootState, type TestStore } from '@/store/store';

/** Mirrors the real root layout: the inbox reader runs above every route. */
function RootStack() {
  useEmailReading();
  return <Stack screenOptions={{ headerShown: false }} />;
}

/** Stand-ins for routes owned by other features, so navigation to them can be asserted. */
function OtherFeatureRoute() {
  return <Text>Other feature</Text>;
}

interface Options {
  preloadedState?: Partial<RootState>;
  store?: TestStore;
}

/**
 * Renders the pipeline routes in a real Expo Router stack, starting at `initialUrl`,
 * with a fresh unpersisted store and the light theme. Only imported by tests.
 */
export async function renderApp(initialUrl: string, options: Options = {}) {
  const { preloadedState, store = makeStore(preloadedState) } = options;
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider preference="light">{children}</ThemeProvider>
      </Provider>
    );
  }
  const result = await renderRouter(
    {
      _layout: RootStack,
      '(tabs)/_layout': TabsLayout,
      '(tabs)/index': PipelineRoute,
      '(tabs)/inbox': OtherFeatureRoute,
      '(tabs)/prep': OtherFeatureRoute,
      'application/new': NewApplicationRoute,
      'application/[id]/index': ApplicationDetailRoute,
      'application/[id]/edit': EditApplicationRoute,
      'inbox/[messageId]': MessageRoute,
      settings: SettingsRoute,
      'intake/new': OtherFeatureRoute,
      'prep/[applicationId]/index': OtherFeatureRoute,
      'prep/[applicationId]/mock': OtherFeatureRoute,
    },
    { initialUrl, wrapper: Wrapper },
  );
  return { store, ...result };
}
