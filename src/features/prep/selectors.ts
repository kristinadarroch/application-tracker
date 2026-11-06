import { createSelector } from '@reduxjs/toolkit';

import { selectAllApplications } from '@/features/applications/model';
import type { Application } from '@/features/applications/model';
import type { ApplicationId, SessionId } from '@/lib/ids';
import type { RootState } from '@/store/store';

import type { MockInterviewSession, PrepQuestionSet } from './schema';
import { sessionsAdapter } from './slice';

const sessionSelectors = sessionsAdapter.getSelectors((state: RootState) => state.prep.sessions);

export const selectQuestionSet = (
  state: RootState,
  applicationId: ApplicationId,
): PrepQuestionSet | undefined => state.prep.questionSets[applicationId];

export interface PrepProgress {
  practiced: number;
  total: number;
}

function progressOf(set: PrepQuestionSet | undefined): PrepProgress {
  const questions = set?.questions ?? [];
  return { practiced: questions.filter((q) => q.practiced).length, total: questions.length };
}

/** Practiced / total prep questions for one application (PREP-2). */
export const selectPrepProgress = createSelector([selectQuestionSet], progressOf);

export const selectSessionById = (
  state: RootState,
  sessionId: SessionId,
): MockInterviewSession | undefined => sessionSelectors.selectById(state, sessionId);

/** Newest first (MOCK-5): the adapter keeps sessions sorted by `startedAt`, descending. */
export const selectSessionsForApplication = createSelector(
  [sessionSelectors.selectAll, (_state: RootState, applicationId: ApplicationId) => applicationId],
  (sessions, applicationId) => sessions.filter((s) => s.applicationId === applicationId),
);

/** The session to resume, if any (MOCK-4). */
export const selectActiveSession = createSelector([selectSessionsForApplication], (sessions) =>
  sessions.find((s) => s.status === 'active'),
);

export interface PrepOverviewItem {
  application: Application;
  progress: PrepProgress;
  sessionCount: number;
}

/** One row per application for the Prep hub. */
export const selectPrepOverview = createSelector(
  [selectAllApplications, (state: RootState) => state.prep],
  (applications, prep): PrepOverviewItem[] => {
    const sessions = Object.values(prep.sessions.entities);
    return applications.map((application) => ({
      application,
      progress: progressOf(prep.questionSets[application.id]),
      sessionCount: sessions.filter((s) => s.applicationId === application.id).length,
    }));
  },
);
