import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { addDays, toIsoDate } from '@/lib/dates';
import { ApplicationIdSchema, createId, NextStepIdSchema } from '@/lib/ids';
import type { RootState } from '@/store/store';

import type { ApplicationInput } from './schema';
import { selectAllApplications } from './selectors';
import { applicationAdded, nextStepAdded } from './slice';

/** Companies match the inbox sample messages so triage has applications to link to. */
export const DEMO_APPLICATIONS: readonly ApplicationInput[] = [
  {
    company: 'Acme Health',
    role: 'Senior React Native Engineer',
    location: 'Austin, TX',
    salary: '$150,000 – $180,000',
    listingUrl: 'https://careers.example.com/acme-health/senior-react-native-engineer',
    stage: 'interviewing',
    notes:
      'Recruiter screen went well. The onsite loop covers mobile system design and a React Native pairing exercise.',
    requirements: [
      '5+ years of React Native',
      'TypeScript',
      'Redux Toolkit',
      'Accessibility experience',
      'CI/CD for mobile apps',
    ],
  },
  {
    company: 'Northwind Labs',
    role: 'Frontend Engineer (React)',
    location: 'Remote',
    salary: undefined,
    listingUrl: undefined,
    stage: 'applied',
    notes: 'Applied through the careers page with a referral from a former teammate.',
    requirements: ['React and TypeScript', 'Design systems', 'Testing Library', 'Web performance'],
  },
  {
    company: 'Globex',
    role: 'Mobile Engineer',
    location: 'New York, NY',
    salary: undefined,
    listingUrl: undefined,
    stage: 'saved',
    notes: 'Hybrid, three days in the office. Strong mobile platform team.',
    requirements: [
      'React Native or native iOS',
      'REST and GraphQL APIs',
      'Shipping App Store releases',
    ],
  },
];

/**
 * Dev-only: adds the demo applications whose company isn't in the pipeline yet, so loading
 * twice never duplicates anything. Returns how many applications were added.
 */
export function loadDemoData(now: Date): ThunkAction<number, RootState, unknown, UnknownAction> {
  return (dispatch, getState) => {
    const existing = new Set(
      selectAllApplications(getState()).map((application) =>
        application.company.trim().toLowerCase(),
      ),
    );
    const missing = DEMO_APPLICATIONS.filter((input) => !existing.has(input.company.toLowerCase()));
    const stamp = now.toISOString();
    for (const input of missing) {
      const id = createId(ApplicationIdSchema, 'app');
      dispatch(applicationAdded({ id, input, now: stamp }));
      if (input.stage === 'interviewing') {
        dispatch(
          nextStepAdded({
            applicationId: id,
            id: createId(NextStepIdSchema, 'step'),
            title: 'Prepare mobile system design examples',
            dueDate: toIsoDate(addDays(now, 1)),
            source: 'manual',
            now: stamp,
          }),
        );
      }
    }
    return missing.length;
  };
}
