import {
  createEntityAdapter,
  createSlice,
  type EntityState,
  type PayloadAction,
} from '@reduxjs/toolkit';

import { applicationRemoved } from '@/features/applications/slice';
import type { ApplicationId, QuestionId, SessionId } from '@/lib/ids';

import type { AnswerFeedback, MockInterviewSession, PrepQuestion, PrepQuestionSet } from './schema';

/** Newest first, so past sessions list in the order MOCK-5 asks for. */
export const sessionsAdapter = createEntityAdapter<MockInterviewSession, SessionId>({
  selectId: (session) => session.id,
  sortComparer: (a, b) => b.startedAt.localeCompare(a.startedAt),
});

export interface PrepState {
  questionSets: Partial<Record<ApplicationId, PrepQuestionSet>>;
  sessions: EntityState<MockInterviewSession, SessionId>;
}

const initialState: PrepState = {
  questionSets: {},
  sessions: sessionsAdapter.getInitialState(),
};

/** The turn waiting for an answer or feedback: the last one in an active session. */
function openTurn(state: PrepState, sessionId: SessionId) {
  const session = state.sessions.entities[sessionId];
  if (session?.status !== 'active') return undefined;
  const turn = session.turns.at(-1);
  return turn?.feedback === undefined ? turn : undefined;
}

export const prepSlice = createSlice({
  name: 'prep',
  initialState,
  reducers: {
    /** A freshly generated set replaces the old one, including practice progress (PREP-1). */
    questionSetReplaced(state, action: PayloadAction<PrepQuestionSet>) {
      state.questionSets[action.payload.applicationId] = action.payload;
    },
    /** Adds questions to the set, creating it when the application has none yet (LATER-1). */
    questionsAdded(
      state,
      action: PayloadAction<{
        applicationId: ApplicationId;
        questions: PrepQuestion[];
        now: string;
      }>,
    ) {
      const { applicationId, questions, now } = action.payload;
      const existing = state.questionSets[applicationId];
      if (existing === undefined) {
        state.questionSets[applicationId] = { applicationId, generatedAt: now, questions };
      } else {
        existing.questions.push(...questions);
      }
    },
    questionPracticeToggled(
      state,
      action: PayloadAction<{ applicationId: ApplicationId; questionId: QuestionId }>,
    ) {
      const { applicationId, questionId } = action.payload;
      const question = state.questionSets[applicationId]?.questions.find(
        (q) => q.id === questionId,
      );
      if (question !== undefined) question.practiced = !question.practiced;
    },
    /** One active session per application: starting a new one ends any other. */
    sessionStarted(state, action: PayloadAction<MockInterviewSession>) {
      const started = action.payload;
      for (const session of Object.values(state.sessions.entities)) {
        if (session.applicationId === started.applicationId && session.status === 'active') {
          session.status = 'ended';
          session.endedAt = started.startedAt;
        }
      }
      sessionsAdapter.addOne(state.sessions, started);
    },
    /** Stored before the AI call, so a failed turn never loses the answer (MOCK-3). */
    turnAnswered(state, action: PayloadAction<{ sessionId: SessionId; answer: string }>) {
      const turn = openTurn(state, action.payload.sessionId);
      if (turn !== undefined) turn.answer = action.payload.answer;
    },
    turnFeedbackReceived(
      state,
      action: PayloadAction<{
        sessionId: SessionId;
        feedback: AnswerFeedback;
        nextQuestion: string;
      }>,
    ) {
      const { sessionId, feedback, nextQuestion } = action.payload;
      const turn = openTurn(state, sessionId);
      if (turn?.answer === undefined) return;
      turn.feedback = feedback;
      state.sessions.entities[sessionId]?.turns.push({ question: nextQuestion });
    },
    sessionEnded(state, action: PayloadAction<{ sessionId: SessionId; now: string }>) {
      const session = state.sessions.entities[action.payload.sessionId];
      if (session?.status !== 'active') return;
      session.status = 'ended';
      session.endedAt = action.payload.now;
    },
  },
  extraReducers: (builder) => {
    // PIPE-5: deleting an application deletes its prep data.
    builder.addCase(applicationRemoved, (state, action) => {
      delete state.questionSets[action.payload];
      sessionsAdapter.removeMany(
        state.sessions,
        Object.values(state.sessions.entities)
          .filter((session) => session.applicationId === action.payload)
          .map((session) => session.id),
      );
    });
  },
});

export const {
  questionSetReplaced,
  questionsAdded,
  questionPracticeToggled,
  sessionStarted,
  turnAnswered,
  turnFeedbackReceived,
  sessionEnded,
} = prepSlice.actions;
