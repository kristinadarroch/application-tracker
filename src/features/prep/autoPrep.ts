import type { TypedStartListening } from '@reduxjs/toolkit';

import { applicationSaved, selectApplicationById } from '@/features/applications/model';
import { selectAiAvailability } from '@/features/capabilities';
import type { AppDispatch, RootState } from '@/store/store';

import { selectQuestionSet } from './selectors';
import { generatePrepQuestionsFor } from './thunks';

/**
 * When the user saves a new application, prep questions start generating in the background, so
 * they are ready (or nearly) by the time Prep is opened. Skipped when AI is unavailable or the
 * application already has questions.
 */
export function startAutoPrepListening(
  startListening: TypedStartListening<RootState, AppDispatch>,
): void {
  startListening({
    actionCreator: applicationSaved,
    effect: async ({ payload }, api) => {
      const state = api.getState();
      if (selectAiAvailability(state)?.status !== 'available') return;
      const application = selectApplicationById(state, payload.id);
      if (application === undefined || selectQuestionSet(state, payload.id) !== undefined) return;
      await api.dispatch(generatePrepQuestionsFor(application));
    },
  });
}
