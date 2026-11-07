import {
  ApplicationIdSchema,
  NextStepIdSchema,
  QuestionIdSchema,
  SessionIdSchema,
} from '@/lib/ids';
import type { RootState } from '@/store/store';

import type { Application, NextStep } from '../schema';
import { applicationsAdapter, type ApplicationsState } from '../slice';

/** Test data builders. Only imported by tests. */
export function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: ApplicationIdSchema.parse('app_acme'),
    company: 'Acme Health',
    role: 'Senior React Native Engineer',
    location: 'Austin, TX',
    stage: 'saved',
    notes: '',
    requirements: [],
    nextSteps: [],
    createdAt: '2026-11-01T09:00:00.000Z',
    updatedAt: '2026-11-01T09:00:00.000Z',
    ...overrides,
  };
}

export function makeNextStep(overrides: Partial<NextStep> = {}): NextStep {
  return {
    id: NextStepIdSchema.parse('step_1'),
    title: 'Book the onsite interview',
    dueDate: '2026-11-10',
    done: false,
    source: 'manual',
    ...overrides,
  };
}

export function applicationsState(...applications: Application[]): ApplicationsState {
  return applicationsAdapter.setAll(applicationsAdapter.getInitialState(), applications);
}

/**
 * Prep state with `total` questions (the first `practiced` marked practiced) and `mockCount`
 * ended mock interviews per application.
 */
export function prepState(
  byApplication: Record<string, { practiced: number; total: number; mockCount: number }>,
): RootState['prep'] {
  const questionSets: RootState['prep']['questionSets'] = {};
  const sessions: RootState['prep']['sessions'] = { ids: [], entities: {} };
  for (const [rawId, { practiced, total, mockCount }] of Object.entries(byApplication)) {
    const applicationId = ApplicationIdSchema.parse(rawId);
    questionSets[applicationId] = {
      applicationId,
      generatedAt: '2026-11-04T09:00:00.000Z',
      questions: Array.from({ length: total }, (_, index) => ({
        id: QuestionIdSchema.parse(`${rawId}_q${index}`),
        type: 'behavioral' as const,
        text: `Question ${index + 1}`,
        practiced: index < practiced,
      })),
    };
    for (let index = 0; index < mockCount; index += 1) {
      const id = SessionIdSchema.parse(`${rawId}_s${index}`);
      sessions.ids.push(id);
      sessions.entities[id] = {
        id,
        applicationId,
        startedAt: '2026-11-04T09:00:00.000Z',
        endedAt: '2026-11-04T09:30:00.000Z',
        status: 'ended',
        turns: [],
      };
    }
  }
  return { questionSets, sessions };
}
