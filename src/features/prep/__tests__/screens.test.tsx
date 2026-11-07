import { act, fireEvent, screen } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import { ApplicationIdSchema, QuestionIdSchema, SessionIdSchema } from '@/lib/ids';
import { err, ok } from '@/lib/result';
import type { TestStore } from '@/store/store';

import type { MockInterviewSession, PrepQuestionSet } from '../schema';
import { selectQuestionSet } from '../selectors';
import { sessionsAdapter, type PrepState } from '../slice';
import { fakeGenerate, makeApplication, makePrepStore, renderPrepRoute } from '../testing';

jest.mock('@/services/ai/foundationModels', () => ({
  onDeviceModel: { availability: jest.fn(), generate: jest.fn() },
}));

const application = makeApplication();
const PREP_URL = `/prep/${application.id}`;
const MOCK_URL = `/prep/${application.id}/mock`;

const existingSet: PrepQuestionSet = {
  applicationId: application.id,
  generatedAt: '2026-11-01T10:00:00.000Z',
  questions: [
    {
      id: QuestionIdSchema.parse('q1'),
      type: 'behavioral',
      text: 'Old behavioral question',
      practiced: true,
    },
    {
      id: QuestionIdSchema.parse('q2'),
      type: 'technical',
      text: 'Old technical question',
      practiced: false,
    },
  ],
};

function prepState(set?: PrepQuestionSet, sessions: MockInterviewSession[] = []): PrepState {
  return {
    questionSets: set === undefined ? {} : { [set.applicationId]: set },
    sessions: sessionsAdapter.setAll(sessionsAdapter.getInitialState(), sessions),
  };
}

const generatedQuestions = {
  behavioral: ['Tell me about a time you disagreed with a designer.'],
  technical: ['How would you debug a slow FlatList?'],
  role_specific: ['As a Senior React Native Engineer, how have you used Redux Toolkit?'],
  ask_them: ['What does success look like in the first 90 days?'],
};

beforeEach(() => {
  fakeGenerate.mockReset();
  jest.restoreAllMocks();
});

async function press(name: string | RegExp) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

describe('Prep questions screen', () => {
  it('generates questions on open, grouped by type, and tracks practice progress (PREP-1, PREP-2)', async () => {
    fakeGenerate.mockResolvedValueOnce(ok(generatedQuestions));
    await renderPrepRoute(PREP_URL, makePrepStore());

    expect(screen.queryByRole('button', { name: 'Generate prep questions' })).toBeNull();

    expect(await screen.findByText('0 / 4 practiced')).toBeOnTheScreen();
    for (const header of ['Behavioral', 'Technical', 'Role-specific', 'Questions to ask them']) {
      expect(screen.getByRole('header', { name: header })).toBeOnTheScreen();
    }
    const question = screen.getByRole('checkbox', { name: 'How would you debug a slow FlatList?' });
    expect(question).not.toBeChecked();

    await fireEvent.press(question);

    expect(question).toBeChecked();
    expect(screen.getByText('1 / 4 practiced')).toBeOnTheScreen();
  });

  it('generates once on open, so a second run never wipes practice progress (PREP-1, PREP-2)', async () => {
    // Every call succeeds: a second run would replace the set and reset "practiced".
    fakeGenerate.mockResolvedValue(ok(generatedQuestions));
    await renderPrepRoute(PREP_URL, makePrepStore());
    expect(await screen.findByText('0 / 4 practiced')).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByRole('checkbox', { name: 'How would you debug a slow FlatList?' }),
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('1 / 4 practiced')).toBeOnTheScreen();
    expect(fakeGenerate).toHaveBeenCalledTimes(1);
  });

  it('shows Retry when generating on open fails, without retrying on its own (PREP-3)', async () => {
    fakeGenerate.mockResolvedValueOnce(err({ kind: 'timeout', afterMs: 45_000 }));
    await renderPrepRoute(PREP_URL, makePrepStore());

    expect(await screen.findByText('That took too long')).toBeOnTheScreen();
    expect(fakeGenerate).toHaveBeenCalledTimes(1);

    fakeGenerate.mockResolvedValueOnce(ok(generatedQuestions));
    await press('Retry');
    expect(await screen.findByText('0 / 4 practiced')).toBeOnTheScreen();
    expect(fakeGenerate).toHaveBeenCalledTimes(2);
  });

  it('asks before replacing an existing set (PREP-1)', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    fakeGenerate.mockResolvedValueOnce(ok(generatedQuestions));
    await renderPrepRoute(PREP_URL, makePrepStore({ prep: prepState(existingSet) }));

    await press('Regenerate');

    expect(alert).toHaveBeenCalledWith(
      'Replace prep questions?',
      expect.any(String),
      expect.any(Array),
    );
    expect(fakeGenerate).not.toHaveBeenCalled();

    const buttons: AlertButton[] = alert.mock.calls[0]?.[2] ?? [];
    await act(async () => buttons.find((b) => b.text === 'Replace')?.onPress?.());

    expect(await screen.findByText('0 / 4 practiced')).toBeOnTheScreen();
    expect(screen.queryByText('Old behavioral question')).not.toBeOnTheScreen();
  });

  it('keeps the existing set and offers Retry when generation fails (PREP-3)', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    fakeGenerate.mockResolvedValueOnce(err({ kind: 'timeout', afterMs: 45_000 }));
    const store = makePrepStore({ prep: prepState(existingSet) });
    await renderPrepRoute(PREP_URL, store);

    await press('Regenerate');
    const buttons: AlertButton[] = alert.mock.calls[0]?.[2] ?? [];
    await act(async () => buttons.find((b) => b.text === 'Replace')?.onPress?.());

    expect(await screen.findByText('That took too long')).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Old behavioral question' })).toBeChecked();
    expect(screen.getByText('1 / 2 practiced')).toBeOnTheScreen();
    expect(selectQuestionSet(store.getState(), application.id)).toEqual(existingSet);

    fakeGenerate.mockResolvedValueOnce(ok(generatedQuestions));
    await press('Retry');

    expect(await screen.findByText('0 / 4 practiced')).toBeOnTheScreen();
  });

  it('shows why AI is unavailable instead of Generate, and keeps practice toggles working (UX-7)', async () => {
    await renderPrepRoute(
      PREP_URL,
      makePrepStore({
        ai: { status: 'unavailable', reason: 'unsupported_platform' },
        prep: prepState(existingSet),
      }),
    );

    expect(screen.getByText('AI isn’t available')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'AI features need Apple Intelligence, which isn’t available on this device.',
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Regenerate' })).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Old technical question' }));
    expect(screen.getByText('2 / 2 practiced')).toBeOnTheScreen();
  });

  it('hides Generate when AI is unavailable and there are no questions yet (UX-7)', async () => {
    await renderPrepRoute(
      PREP_URL,
      makePrepStore({ ai: { status: 'unavailable', reason: 'apple_intelligence_unavailable' } }),
    );

    expect(screen.getByText(/Apple Intelligence isn’t available/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Generate prep questions' })).not.toBeOnTheScreen();
  });

  it('lists past sessions newest first (MOCK-5)', async () => {
    const ended = (id: string, startedAt: string): MockInterviewSession => ({
      id: SessionIdSchema.parse(id),
      applicationId: application.id,
      startedAt,
      endedAt: startedAt,
      status: 'ended',
      turns: [{ question: 'Q' }],
    });
    await renderPrepRoute(
      PREP_URL,
      makePrepStore({
        prep: prepState(existingSet, [
          ended('ses_old', '2026-10-01T10:00:00.000Z'),
          ended('ses_new', '2026-11-01T10:00:00.000Z'),
        ]),
      }),
    );

    const rows = screen.getAllByRole('button', { name: /answers · Ended/ });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAccessibleName(/Nov/);
    expect(rows[1]).toHaveAccessibleName(/Oct/);
  });
});

describe('Mock interview screen', () => {
  const firstQuestion = 'Walk me through a React Native app you shipped.';
  const firstAnswer = 'I shipped a telehealth app with offline sync.';
  const secondQuestion = 'How do you keep a FlatList fast?';
  const feedback = {
    strengths: ['Concrete example'],
    gaps: ['No metrics on impact'],
    strongerAnswer: 'I shipped a telehealth app used by 40k patients…',
  };

  /** Opening the screen asks the first question on its own; this answers it. */
  async function answerFirstQuestion(store: TestStore) {
    fakeGenerate
      .mockResolvedValueOnce(ok({ question: firstQuestion }))
      .mockResolvedValueOnce(ok({ ...feedback, nextQuestion: secondQuestion }));
    await renderPrepRoute(MOCK_URL, store);
    expect(await screen.findByText(firstQuestion)).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Your answer'), firstAnswer);
    await press('Submit answer');
    expect(await screen.findByText(secondQuestion)).toBeOnTheScreen();
  }

  it('asks the first question on open, with no Start step, and only once (MOCK-1)', async () => {
    fakeGenerate.mockResolvedValueOnce(ok({ question: firstQuestion }));
    await renderPrepRoute(MOCK_URL, makePrepStore());

    expect(screen.queryByRole('button', { name: 'Start mock interview' })).toBeNull();
    expect(await screen.findByText(firstQuestion)).toBeOnTheScreen();
    expect(fakeGenerate).toHaveBeenCalledTimes(1);
  });

  it('asks a first question, then shows feedback and the next question (MOCK-1, MOCK-2)', async () => {
    await answerFirstQuestion(makePrepStore());

    expect(fakeGenerate.mock.calls[0]?.[0].prompt).toContain('Role: Senior React Native Engineer');
    expect(screen.getByText(firstAnswer)).toBeOnTheScreen();
    expect(screen.getByText('• Concrete example')).toBeOnTheScreen();
    expect(screen.getByText('• No metrics on impact')).toBeOnTheScreen();
    expect(screen.getByText(feedback.strongerAnswer)).toBeOnTheScreen();
    expect(screen.getByLabelText('Your answer')).toHaveDisplayValue('');
  });

  it('keeps the typed answer after a failed turn, sends no earlier answers, and restores everything on return (MOCK-3, MOCK-4)', async () => {
    const store = makePrepStore();
    await answerFirstQuestion(store);

    fakeGenerate.mockResolvedValueOnce(err({ kind: 'timeout', afterMs: 45_000 }));
    await fireEvent.changeText(screen.getByLabelText('Your answer'), 'I memoize rows.');
    await press('Submit answer');

    expect(await screen.findByText('That took too long')).toBeOnTheScreen();
    expect(screen.getByLabelText('Your answer')).toHaveDisplayValue('I memoize rows.');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();

    // Context budget: the second turn sends the earlier question title, never the earlier answer.
    const prompt = fakeGenerate.mock.calls[2]?.[0].prompt ?? '';
    expect(prompt).toContain(`- ${firstQuestion}`);
    expect(prompt).not.toContain(firstAnswer);

    // Leave and come back with the same store.
    await screen.unmount();
    await renderPrepRoute(MOCK_URL, store);

    expect(screen.getByText(firstQuestion)).toBeOnTheScreen();
    expect(screen.getByText(firstAnswer)).toBeOnTheScreen();
    expect(screen.getByText(feedback.strongerAnswer)).toBeOnTheScreen();
    expect(screen.getByText(secondQuestion)).toBeOnTheScreen();
    expect(screen.getByLabelText('Your answer')).toHaveDisplayValue('I memoize rows.');
  });

  it('ends the session and shows a summary of strengths and gaps, without starting another (MOCK-5)', async () => {
    const store = makePrepStore();
    await answerFirstQuestion(store);
    const callsBeforeEnd = fakeGenerate.mock.calls.length;

    await press('End');

    expect(await screen.findByRole('header', { name: 'Session summary' })).toBeOnTheScreen();
    expect(screen.getByText(/1 of 2 questions answered/)).toBeOnTheScreen();
    expect(screen.getAllByText('• Concrete example').length).toBeGreaterThan(0);
    expect(screen.getAllByText('• No metrics on impact').length).toBeGreaterThan(0);
    expect(fakeGenerate).toHaveBeenCalledTimes(callsBeforeEnd);
    expect(store.getState().prep.sessions.ids).toHaveLength(1);
  });

  it('shows why AI is unavailable instead of starting (UX-7)', async () => {
    await renderPrepRoute(
      MOCK_URL,
      makePrepStore({ ai: { status: 'unavailable', reason: 'os_too_old' } }),
    );

    expect(
      screen.getByText('AI features need iOS 26 or later. Update iOS to use them.'),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('Getting your first question')).toBeNull();
    expect(fakeGenerate).not.toHaveBeenCalled();
  });
});

describe('Interview reviews screen (LATER-1)', () => {
  it('needs pasted text, then shows each question with its quote and adds it to prep questions', async () => {
    const store = makePrepStore();
    fakeGenerate.mockResolvedValueOnce(ok({ questions: ['Design an offline sync queue.'] }));
    await renderPrepRoute(`/prep/${application.id}/reviews`, store);

    expect(screen.getByRole('button', { name: 'Find likely questions' })).toBeDisabled();

    await fireEvent.changeText(
      screen.getByLabelText('Paste interview reviews'),
      'Round two: they asked me to design an offline sync queue.',
    );
    await press('Find likely questions');

    expect(await screen.findByText('Design an offline sync queue.')).toBeOnTheScreen();
    expect(
      screen.getByText('“Round two: they asked me to design an offline sync queue.”'),
    ).toBeOnTheScreen();

    await press('Add to prep questions');

    expect(screen.getByRole('button', { name: 'Added to prep questions' })).toBeDisabled();
    expect(selectQuestionSet(store.getState(), application.id)?.questions).toEqual([
      expect.objectContaining({ type: 'role_specific', text: 'Design an offline sync queue.' }),
    ]);
  });

  it('shows an empty state when the reviews mention no questions', async () => {
    fakeGenerate.mockResolvedValueOnce(ok({ questions: [] }));
    await renderPrepRoute(`/prep/${application.id}/reviews`, makePrepStore());

    await fireEvent.changeText(
      screen.getByLabelText('Paste interview reviews'),
      'Friendly team, slow process.',
    );
    await press('Find likely questions');

    expect(await screen.findByText('No questions found')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Add to prep questions' })).not.toBeOnTheScreen();
  });
});

describe('Prep hub', () => {
  it('links to the Pipeline when there are no applications', async () => {
    await renderPrepRoute('/prep', makePrepStore({ applications: [] }));
    expect(screen.getByRole('button', { name: 'Go to Pipeline' })).toBeOnTheScreen();
  });

  it('shows practice progress for each application', async () => {
    const other = makeApplication({
      id: ApplicationIdSchema.parse('app_globex'),
      company: 'Globex',
      role: 'Mobile Engineer',
    });
    await renderPrepRoute(
      '/prep',
      makePrepStore({ applications: [application, other], prep: prepState(existingSet) }),
    );

    expect(screen.getByText('1 / 2 practiced · 0 mock interviews')).toBeOnTheScreen();
    expect(screen.getByText('No prep questions yet · 0 mock interviews')).toBeOnTheScreen();
  });
});
