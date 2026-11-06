import { ApplicationIdSchema, NextStepIdSchema } from '@/lib/ids';

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
