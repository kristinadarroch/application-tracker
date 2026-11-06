import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import type { Application } from '@/features/applications/schema';
import { selectApplicationById } from '@/features/applications/selectors';
import type { AppError } from '@/lib/errors';
import { ApplicationIdSchema } from '@/lib/ids';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import {
  toAppError,
  useAnswerMockInterviewTurnMutation,
  useGeneratePrepQuestionsMutation,
  useStartMockInterviewMutation,
} from './api';
import type { MockInterviewSession } from './schema';
import { questionSetReplaced, sessionStarted, turnAnswered, turnFeedbackReceived } from './slice';

export interface AiAction<Args extends unknown[]> {
  run: (...args: Args) => Promise<void>;
  pending: boolean;
  error: AppError | undefined;
}

/**
 * PREP-1/PREP-3: the set in the store is replaced only on success, so a failure leaves it as it was.
 * The request state is keyed by application, so it survives leaving and returning to the screen.
 */
export function useGeneratePrepQuestions(application: Application): AiAction<[]> {
  const dispatch = useAppDispatch();
  const [trigger, state] = useGeneratePrepQuestionsMutation({
    fixedCacheKey: `prep-questions-${application.id}`,
  });
  const run = useCallback(async () => {
    const result = await trigger(application);
    if (result.data !== undefined) dispatch(questionSetReplaced(result.data));
  }, [application, dispatch, trigger]);
  return { run, pending: state.isLoading, error: toAppError(state.error) };
}

/** MOCK-1: asks the opening question, then records the new active session. */
export function useStartMockInterview(application: Application): AiAction<[]> {
  const dispatch = useAppDispatch();
  const [trigger, state] = useStartMockInterviewMutation({
    fixedCacheKey: `mock-start-${application.id}`,
  });
  const run = useCallback(async () => {
    const result = await trigger(application);
    if (result.data !== undefined) dispatch(sessionStarted(result.data));
  }, [application, dispatch, trigger]);
  return { run, pending: state.isLoading, error: toAppError(state.error) };
}

/**
 * MOCK-2/MOCK-3: the answer is stored before the AI call, so a failure or leaving the screen never loses it.
 * Only earlier question titles are sent, never the transcript, to stay inside the context budget.
 */
export function useAnswerMockInterviewTurn(
  application: Application,
  session: MockInterviewSession,
): AiAction<[answer: string]> {
  const dispatch = useAppDispatch();
  const [trigger, state] = useAnswerMockInterviewTurnMutation({
    fixedCacheKey: `mock-turn-${session.id}`,
  });
  const run = useCallback(
    async (answer: string) => {
      const current = session.turns.at(-1);
      if (current === undefined) return;
      dispatch(turnAnswered({ sessionId: session.id, answer }));
      const result = await trigger({
        application,
        currentQuestion: current.question,
        answer,
        earlierQuestions: session.turns.slice(0, -1).map((turn) => turn.question),
      });
      if (result.data !== undefined) {
        dispatch(turnFeedbackReceived({ sessionId: session.id, ...result.data }));
      }
    },
    [application, dispatch, session, trigger],
  );
  return { run, pending: state.isLoading, error: toAppError(state.error) };
}

/** The application named by the route's `applicationId` param, or `undefined` if it doesn't exist. */
export function useRouteApplication(): Application | undefined {
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>();
  const parsed = ApplicationIdSchema.safeParse(applicationId);
  return useAppSelector((state) =>
    parsed.success ? selectApplicationById(state, parsed.data) : undefined,
  );
}
