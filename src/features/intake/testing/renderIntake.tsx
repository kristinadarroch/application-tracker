import { Stack, useLocalSearchParams } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import NewIntakeRoute from '@/app/intake/new';
import ReviewDraftRoute from '@/app/intake/review/[draftId]';
import ShareRoute from '@/app/intake/share';
import { Text, ThemeProvider } from '@/design-system';
import { DraftsBanner } from '@/features/intake/components/DraftsBanner';
import type { AiAvailability } from '@/services/ai/model';
import { makeStore, type RootState, type TestStore } from '@/store/store';

function RootStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

/** Stand-ins for routes owned by other features; they show which route opened. */
function PipelineStub() {
  return (
    <>
      <Text variant="title">Pipeline</Text>
      <DraftsBanner />
    </>
  );
}
function ManualFormStub() {
  return <Text variant="title">Manual form</Text>;
}
function ApplicationStub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Text variant="title">{`Application ${id}`}</Text>;
}

export const AI_AVAILABLE: AiAvailability = { status: 'available', contextTokens: 4096 };

interface Options {
  preloadedState?: Partial<RootState>;
  /** `null` means availability hasn't been checked yet, as at cold start. */
  ai?: AiAvailability | null;
}

/**
 * Renders the intake routes in a real Expo Router stack starting at `initialUrl`, with a
 * fresh store where AI is available unless `ai` says otherwise. Only imported by tests.
 */
export async function renderIntake(initialUrl: string, options: Options = {}) {
  const { preloadedState = {}, ai = AI_AVAILABLE } = options;
  const store: TestStore = makeStore({ ...preloadedState, capabilities: { ai } });
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
      '(tabs)/index': PipelineStub,
      'intake/new': NewIntakeRoute,
      'intake/share': ShareRoute,
      'intake/review/[draftId]': ReviewDraftRoute,
      'application/new': ManualFormStub,
      'application/[id]/index': ApplicationStub,
    },
    { initialUrl, wrapper: Wrapper },
  );
  return { store, ...result };
}
