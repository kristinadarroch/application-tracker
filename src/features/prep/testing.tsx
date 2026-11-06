import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import type { z } from 'zod';

import { ThemeProvider } from '@/design-system';
import type { Application } from '@/features/applications/model';
import { applicationsAdapter } from '@/features/applications/model';
import { ApplicationIdSchema } from '@/lib/ids';
import type { AppError } from '@/lib/errors';
import type { Result } from '@/lib/result';
import { onDeviceModel } from '@/services/ai/foundationModels';
import type { AiAvailability, GenerateRequest } from '@/services/ai/model';
import { makeStore, type RootState, type TestStore } from '@/store/store';

import { InterviewReviewsScreen } from './screens/InterviewReviewsScreen';
import { MockInterviewScreen } from './screens/MockInterviewScreen';
import { PrepHubScreen } from './screens/PrepHubScreen';
import { PrepQuestionsScreen } from './screens/PrepQuestionsScreen';
import { SessionSummaryScreen } from './screens/SessionSummaryScreen';
import type { PrepState } from './slice';

/**
 * Test-only helpers. Test files must call
 * `jest.mock('@/services/ai/foundationModels', () => ({ onDeviceModel: { availability: jest.fn(), generate: jest.fn() } }))`
 * so `fakeGenerate` is a jest mock.
 */
export const fakeGenerate = onDeviceModel.generate as unknown as jest.Mock<
  Promise<Result<unknown, AppError>>,
  [request: GenerateRequest<z.ZodObject>]
>;

export const AI_AVAILABLE: AiAvailability = { status: 'available', contextTokens: 4096 };

export function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: ApplicationIdSchema.parse('app_acme'),
    company: 'Acme Health',
    role: 'Senior React Native Engineer',
    location: 'Austin, TX',
    stage: 'interviewing',
    notes: 'Hybrid role building patient-facing mobile features.',
    requirements: ['5+ years React Native', 'TypeScript', 'Redux Toolkit'],
    nextSteps: [],
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    ...overrides,
  };
}

interface StoreOptions {
  applications?: Application[];
  ai?: AiAvailability | null;
  prep?: PrepState;
}

export function makePrepStore({
  applications = [makeApplication()],
  ai = AI_AVAILABLE,
  prep,
}: StoreOptions = {}): TestStore {
  const preloaded: Partial<RootState> = {
    applications: applicationsAdapter.setAll(applicationsAdapter.getInitialState(), applications),
    capabilities: { ai },
    ...(prep === undefined ? {} : { prep }),
  };
  return makeStore(preloaded);
}

/** Renders the prep routes at `initialUrl` with Redux and the light theme. */
export function renderPrepRoute(initialUrl: string, store: TestStore) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider preference="light">{children}</ThemeProvider>
      </Provider>
    );
  }
  return renderRouter(
    {
      index: () => null,
      '(tabs)/prep': PrepHubScreen,
      'prep/[applicationId]/index': PrepQuestionsScreen,
      'prep/[applicationId]/mock': MockInterviewScreen,
      'prep/[applicationId]/session/[sessionId]': SessionSummaryScreen,
      'prep/[applicationId]/reviews': InterviewReviewsScreen,
    },
    { initialUrl, wrapper: Wrapper },
  );
}
