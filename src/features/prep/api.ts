import type { SerializedError } from '@reduxjs/toolkit';

import type { Application } from '@/features/applications/model';
import type { AppError } from '@/lib/errors';
import { aiApi } from '@/services/ai/aiApi';

import type { MockInterviewSession, MockInterviewTurnOutput, PrepQuestionSet } from './schema';
import {
  answerMockInterviewTurn,
  findReviewQuestions,
  generatePrepQuestions,
  startMockInterview,
  type MockInterviewTurnInput,
  type ReviewQuestions,
  type ReviewQuestionsInput,
} from './tasks';

/**
 * Prep AI tasks as RTK Query mutations: each one is a user action, not cached data.
 * Results are copied into the `prep` slice by the feature hooks, so they persist.
 */
export const prepApi = aiApi.injectEndpoints({
  endpoints: (build) => ({
    generatePrepQuestions: build.mutation<PrepQuestionSet, Application>({
      queryFn: async (application) => {
        const result = await generatePrepQuestions(application);
        return result.ok ? { data: result.value } : { error: result.error };
      },
    }),
    startMockInterview: build.mutation<MockInterviewSession, Application>({
      queryFn: async (application) => {
        const result = await startMockInterview(application);
        return result.ok ? { data: result.value } : { error: result.error };
      },
    }),
    answerMockInterviewTurn: build.mutation<MockInterviewTurnOutput, MockInterviewTurnInput>({
      queryFn: async (input) => {
        const result = await answerMockInterviewTurn(input);
        return result.ok ? { data: result.value } : { error: result.error };
      },
    }),
    findReviewQuestions: build.mutation<ReviewQuestions, ReviewQuestionsInput>({
      queryFn: async (input) => {
        const result = await findReviewQuestions(input);
        return result.ok ? { data: result.value } : { error: result.error };
      },
    }),
  }),
});

export const {
  useGeneratePrepQuestionsMutation,
  useStartMockInterviewMutation,
  useAnswerMockInterviewTurnMutation,
  useFindReviewQuestionsMutation,
} = prepApi;

/**
 * Mutation errors are typed `AppError | SerializedError`; the latter only appears if a task throws,
 * which the tasks never do by contract. Map it anyway so screens only ever see `AppError`.
 */
export function toAppError(error: AppError | SerializedError | undefined): AppError | undefined {
  if (error === undefined) return undefined;
  return 'kind' in error ? error : { kind: 'ai_failed', code: error.code ?? 'unexpected' };
}
