import { applicationRemoved } from '@/features/applications/model';
import { ApplicationIdSchema, QuestionIdSchema, SessionIdSchema } from '@/lib/ids';
import { makeStore } from '@/store/store';

import type { MockInterviewSession, PrepQuestion, PrepQuestionSet } from '../schema';
import {
  selectActiveSession,
  selectPrepProgress,
  selectQuestionSet,
  selectSessionById,
  selectSessionsForApplication,
} from '../selectors';
import {
  questionPracticeToggled,
  questionSetReplaced,
  questionsAdded,
  sessionEnded,
  sessionStarted,
  turnAnswered,
  turnFeedbackReceived,
} from '../slice';

const appId = ApplicationIdSchema.parse('app_acme');
const otherAppId = ApplicationIdSchema.parse('app_globex');

function question(id: string, type: PrepQuestion['type'] = 'behavioral'): PrepQuestion {
  return { id: QuestionIdSchema.parse(id), type, text: `Question ${id}`, practiced: false };
}

function questionSet(applicationId = appId, ids = ['q1', 'q2', 'q3']): PrepQuestionSet {
  return {
    applicationId,
    generatedAt: '2026-11-01T10:00:00.000Z',
    questions: ids.map((id) => question(id)),
  };
}

function session(id: string, startedAt: string, applicationId = appId): MockInterviewSession {
  return {
    id: SessionIdSchema.parse(id),
    applicationId,
    startedAt,
    status: 'active',
    turns: [{ question: 'Tell me about a hard bug you fixed.' }],
  };
}

const feedback = {
  strengths: ['Clear structure'],
  gaps: ['No measurable result'],
  strongerAnswer: 'I cut crash rate by 40% by…',
};

describe('prep questions', () => {
  it('tracks practiced progress as questions are toggled (PREP-2)', () => {
    const store = makeStore();
    store.dispatch(questionSetReplaced(questionSet()));
    expect(selectPrepProgress(store.getState(), appId)).toEqual({ practiced: 0, total: 3 });

    store.dispatch(
      questionPracticeToggled({ applicationId: appId, questionId: QuestionIdSchema.parse('q2') }),
    );
    expect(selectPrepProgress(store.getState(), appId)).toEqual({ practiced: 1, total: 3 });

    store.dispatch(
      questionPracticeToggled({ applicationId: appId, questionId: QuestionIdSchema.parse('q2') }),
    );
    expect(selectPrepProgress(store.getState(), appId)).toEqual({ practiced: 0, total: 3 });
  });

  it('replaces the whole set, including progress, when regenerated (PREP-1)', () => {
    const store = makeStore();
    store.dispatch(questionSetReplaced(questionSet()));
    store.dispatch(
      questionPracticeToggled({ applicationId: appId, questionId: QuestionIdSchema.parse('q1') }),
    );

    store.dispatch(questionSetReplaced(questionSet(appId, ['n1', 'n2'])));

    expect(selectQuestionSet(store.getState(), appId)?.questions.map((q) => q.id)).toEqual([
      'n1',
      'n2',
    ]);
    expect(selectPrepProgress(store.getState(), appId)).toEqual({ practiced: 0, total: 2 });
  });

  it('adds review questions to an existing set or starts one (LATER-1)', () => {
    const store = makeStore();
    const now = '2026-11-02T10:00:00.000Z';
    store.dispatch(
      questionsAdded({ applicationId: appId, questions: [question('r1', 'role_specific')], now }),
    );
    expect(selectPrepProgress(store.getState(), appId)).toEqual({ practiced: 0, total: 1 });

    store.dispatch(
      questionsAdded({ applicationId: appId, questions: [question('r2', 'role_specific')], now }),
    );
    expect(selectQuestionSet(store.getState(), appId)?.questions.map((q) => q.id)).toEqual([
      'r1',
      'r2',
    ]);
  });
});

describe('mock interview sessions', () => {
  const sessionId = SessionIdSchema.parse('ses_1');

  it('runs a session from first question to end (MOCK-1, MOCK-2, MOCK-5)', () => {
    const store = makeStore();
    store.dispatch(sessionStarted(session('ses_1', '2026-11-01T10:00:00.000Z')));
    expect(selectActiveSession(store.getState(), appId)?.id).toBe(sessionId);

    store.dispatch(turnAnswered({ sessionId, answer: 'I bisected the release.' }));
    store.dispatch(
      turnFeedbackReceived({
        sessionId,
        feedback,
        nextQuestion: 'How do you test native modules?',
      }),
    );

    expect(selectSessionById(store.getState(), sessionId)?.turns).toEqual([
      {
        question: 'Tell me about a hard bug you fixed.',
        answer: 'I bisected the release.',
        feedback,
      },
      { question: 'How do you test native modules?' },
    ]);

    store.dispatch(sessionEnded({ sessionId, now: '2026-11-01T10:30:00.000Z' }));
    expect(selectActiveSession(store.getState(), appId)).toBeUndefined();
    expect(selectSessionById(store.getState(), sessionId)).toMatchObject({
      status: 'ended',
      endedAt: '2026-11-01T10:30:00.000Z',
    });
  });

  it('keeps the answer when feedback never arrives (MOCK-3)', () => {
    const store = makeStore();
    store.dispatch(sessionStarted(session('ses_1', '2026-11-01T10:00:00.000Z')));
    store.dispatch(turnAnswered({ sessionId, answer: 'My unsent answer' }));

    const turns = selectSessionById(store.getState(), sessionId)?.turns;
    expect(turns).toEqual([
      { question: 'Tell me about a hard bug you fixed.', answer: 'My unsent answer' },
    ]);
  });

  it('ignores feedback for an ended session', () => {
    const store = makeStore();
    store.dispatch(sessionStarted(session('ses_1', '2026-11-01T10:00:00.000Z')));
    store.dispatch(turnAnswered({ sessionId, answer: 'Answer' }));
    store.dispatch(sessionEnded({ sessionId, now: '2026-11-01T10:05:00.000Z' }));
    store.dispatch(turnFeedbackReceived({ sessionId, feedback, nextQuestion: 'Next?' }));

    expect(selectSessionById(store.getState(), sessionId)?.turns).toHaveLength(1);
  });

  it('lists sessions newest first and keeps one active session per application (MOCK-5)', () => {
    const store = makeStore();
    store.dispatch(sessionStarted(session('ses_old', '2026-11-01T10:00:00.000Z')));
    store.dispatch(sessionStarted(session('ses_new', '2026-11-03T10:00:00.000Z')));

    const sessions = selectSessionsForApplication(store.getState(), appId);
    expect(sessions.map((s) => [s.id, s.status])).toEqual([
      ['ses_new', 'active'],
      ['ses_old', 'ended'],
    ]);
  });
});

describe('deleting an application (PIPE-5)', () => {
  it('drops its question set and sessions, and keeps other applications’ data', () => {
    const store = makeStore();
    store.dispatch(questionSetReplaced(questionSet(appId)));
    store.dispatch(questionSetReplaced(questionSet(otherAppId)));
    store.dispatch(sessionStarted(session('ses_a', '2026-11-01T10:00:00.000Z', appId)));
    store.dispatch(sessionStarted(session('ses_b', '2026-11-01T11:00:00.000Z', otherAppId)));

    store.dispatch(applicationRemoved(appId));

    const state = store.getState();
    expect(selectQuestionSet(state, appId)).toBeUndefined();
    expect(selectSessionsForApplication(state, appId)).toEqual([]);
    expect(selectQuestionSet(state, otherAppId)).toBeDefined();
    expect(selectSessionsForApplication(state, otherAppId)).toHaveLength(1);
  });
});
