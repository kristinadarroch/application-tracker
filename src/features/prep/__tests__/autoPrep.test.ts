import { waitFor } from '@testing-library/react-native';

import { applicationAdded, applicationSaved } from '@/features/applications/model';
import { ok } from '@/lib/result';

import { selectQuestionSet } from '../selectors';
import { fakeGenerate, makeApplication, makePrepStore } from '../testing';

jest.mock('@/services/ai/foundationModels', () => ({
  onDeviceModel: { availability: jest.fn(), generate: jest.fn() },
}));

const application = makeApplication();
const questions = {
  behavioral: ['Tell me about a time you disagreed with a designer.'],
  technical: ['How would you debug a slow FlatList?'],
  role_specific: ['How have you used Redux Toolkit?'],
  ask_them: ['What does success look like in 90 days?'],
};

beforeEach(() => fakeGenerate.mockReset());

describe('prep questions generate when a job is saved (PREP-1)', () => {
  it('generates and stores them in the background, before Prep is opened', async () => {
    fakeGenerate.mockResolvedValueOnce(ok(questions));
    const store = makePrepStore();

    store.dispatch(applicationSaved({ id: application.id }));

    await waitFor(() =>
      expect(selectQuestionSet(store.getState(), application.id)?.questions).toHaveLength(4),
    );
    expect(fakeGenerate).toHaveBeenCalledTimes(1);
    expect(fakeGenerate.mock.calls[0]?.[0].prompt).toContain('Senior React Native Engineer');
  });

  it('does nothing for demo data, which adds applications without saving them from a form', async () => {
    const store = makePrepStore({ applications: [] });
    const { company, role, stage, notes, requirements } = application;
    store.dispatch(
      applicationAdded({
        id: application.id,
        input: {
          company,
          role,
          stage,
          notes,
          requirements,
          location: undefined,
          salary: undefined,
          listingUrl: undefined,
        },
        now: application.createdAt,
      }),
    );
    await Promise.resolve();
    expect(fakeGenerate).not.toHaveBeenCalled();
  });

  it('does nothing when AI is unavailable', async () => {
    const store = makePrepStore({ ai: { status: 'unavailable', reason: 'unsupported_platform' } });
    store.dispatch(applicationSaved({ id: application.id }));
    await Promise.resolve();
    expect(fakeGenerate).not.toHaveBeenCalled();
  });
});
