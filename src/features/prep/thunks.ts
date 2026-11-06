import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { Application } from '@/features/applications/model';
import type { ApplicationId } from '@/lib/ids';
import type { RootState } from '@/store/store';

import { prepApi } from './api';
import { questionSetReplaced, sessionStarted } from './slice';

type PrepThunk = ThunkAction<Promise<void>, RootState, unknown, UnknownAction>;

/**
 * Request state is shared by key, so a request started elsewhere (in the background, or by an
 * earlier visit to the screen) shows as pending wherever the same key is read.
 */
export function prepQuestionsCacheKey(applicationId: ApplicationId): string {
  return `prep-questions-${applicationId}`;
}

export function mockStartCacheKey(applicationId: ApplicationId): string {
  return `mock-start-${applicationId}`;
}

function isPending(state: RootState, fixedCacheKey: string): boolean {
  return state.aiApi.mutations[fixedCacheKey]?.status === 'pending';
}

/**
 * PREP-1/PREP-3: generates prep questions and stores them. Does nothing while a request for the
 * same application is running, so the background trigger and the screen never generate twice.
 * A failure leaves any existing set as it was.
 */
export function generatePrepQuestionsFor(application: Application): PrepThunk {
  return async (dispatch, getState) => {
    const fixedCacheKey = prepQuestionsCacheKey(application.id);
    if (isPending(getState(), fixedCacheKey)) return;
    const result = await dispatch(
      prepApi.endpoints.generatePrepQuestions.initiate(application, { fixedCacheKey }),
    );
    if ('data' in result && result.data !== undefined) dispatch(questionSetReplaced(result.data));
  };
}

/** MOCK-1: asks the opening question and records the new session; never starts two at once. */
export function startMockInterviewFor(application: Application): PrepThunk {
  return async (dispatch, getState) => {
    const fixedCacheKey = mockStartCacheKey(application.id);
    if (isPending(getState(), fixedCacheKey)) return;
    const result = await dispatch(
      prepApi.endpoints.startMockInterview.initiate(application, { fixedCacheKey }),
    );
    if ('data' in result && result.data !== undefined) dispatch(sessionStarted(result.data));
  };
}
