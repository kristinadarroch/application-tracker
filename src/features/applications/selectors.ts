import { createSelector } from '@reduxjs/toolkit';

import { isUrgent } from '@/lib/dates';
import type { ApplicationId } from '@/lib/ids';
import { STAGES, type Stage } from '@/lib/stage';
import type { RootState } from '@/store/store';

import type { Application, NextStep } from './schema';
import { applicationsAdapter } from './slice';

const adapterSelectors = applicationsAdapter.getSelectors((state: RootState) => state.applications);

export const selectAllApplications = adapterSelectors.selectAll;
export const selectApplicationById = (
  state: RootState,
  id: ApplicationId,
): Application | undefined => adapterSelectors.selectById(state, id);

/** Every stage is present, in pipeline order, even when empty (PIPE-1). */
export const selectApplicationsByStage = createSelector([selectAllApplications], (applications) => {
  const byStage = Object.fromEntries(STAGES.map((stage) => [stage, [] as Application[]])) as Record<
    Stage,
    Application[]
  >;
  for (const application of applications) byStage[application.stage].push(application);
  return byStage;
});

export const selectPipelineCounts = createSelector(
  [selectApplicationsByStage],
  (byStage) =>
    Object.fromEntries(STAGES.map((stage) => [stage, byStage[stage].length])) as Record<
      Stage,
      number
    >,
);

export interface UpcomingNextStep {
  applicationId: ApplicationId;
  company: string;
  role: string;
  step: NextStep;
  urgent: boolean;
}

/** Open Next Steps across all applications, soonest first. `now` is passed in so results are testable. */
export const selectUpcomingNextSteps = createSelector(
  [selectAllApplications, (_state: RootState, now: Date) => now.getTime()],
  (applications, nowMs): UpcomingNextStep[] => {
    const now = new Date(nowMs);
    return applications
      .flatMap((application) =>
        application.nextSteps
          .filter((step) => !step.done)
          .map((step) => ({
            applicationId: application.id,
            company: application.company,
            role: application.role,
            step,
            urgent: isUrgent(step.dueDate, now),
          })),
      )
      .sort((a, b) => a.step.dueDate.localeCompare(b.step.dueDate));
  },
);

/** Soonest urgent open Next Step per application; drives the pipeline card's warning badge (PIPE-6). */
export const selectUrgentNextStepByApplication = createSelector(
  [selectUpcomingNextSteps],
  (upcoming): ReadonlyMap<ApplicationId, NextStep> => {
    const byApplication = new Map<ApplicationId, NextStep>();
    for (const item of upcoming) {
      if (item.urgent && !byApplication.has(item.applicationId)) {
        byApplication.set(item.applicationId, item.step);
      }
    }
    return byApplication;
  },
);

/** Whether a stage means the application was sent. Withdrawn can happen before applying. */
const SENT: Record<Stage, boolean> = {
  saved: false,
  applied: true,
  interviewing: true,
  offer: true,
  rejected: true,
  withdrawn: false,
};
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Applications added in the last 7 days that have been sent (stage Applied or later). */
export const selectSentThisWeekCount = createSelector(
  [selectAllApplications, (_state: RootState, now: Date) => now.getTime()],
  (applications, nowMs): number =>
    applications.filter(
      (application) =>
        SENT[application.stage] && nowMs - new Date(application.createdAt).getTime() <= WEEK_MS,
    ).length,
);

/** Prep questions marked practiced, across every application. Reads prep state only through `RootState`. */
export const selectPracticedQuestionCount = createSelector(
  [(state: RootState) => state.prep.questionSets],
  (questionSets): number =>
    Object.values(questionSets).reduce(
      (sum, set) => sum + (set?.questions.filter((question) => question.practiced).length ?? 0),
      0,
    ),
);

export interface PrepSummary {
  practiced: number;
  total: number;
  mockCount: number;
}

/**
 * Practiced / total prep questions and mock interview count per application.
 * Reads prep state only through `RootState`.
 */
export const selectPrepSummaryByApplication = createSelector(
  [selectAllApplications, (state: RootState) => state.prep],
  (applications, prep): ReadonlyMap<ApplicationId, PrepSummary> => {
    const sessions = Object.values(prep.sessions.entities);
    const byApplication = new Map<ApplicationId, PrepSummary>();
    for (const application of applications) {
      const questions = prep.questionSets[application.id]?.questions ?? [];
      byApplication.set(application.id, {
        practiced: questions.filter((question) => question.practiced).length,
        total: questions.length,
        mockCount: sessions.filter((session) => session.applicationId === application.id).length,
      });
    }
    return byApplication;
  },
);

export interface NextInterview extends PrepSummary {
  application: Application;
  /** Interviewing applications besides this one. */
  otherCount: number;
}

/** Summary for an application with no prep questions or mock interviews. */
export const NO_PREP: PrepSummary = { practiced: 0, total: 0, mockCount: 0 };

/** Due date of the soonest open Next Step, if any. ISO dates sort as strings. */
function soonestOpenDueDate(application: Application): string | undefined {
  return application.nextSteps
    .filter((step) => !step.done)
    .map((step) => step.dueDate)
    .sort()[0];
}

/**
 * The Interviewing application to prep for first: soonest open Next Step due date
 * (overdue steps count as soonest; applications without one go last), ties broken by
 * most recently updated. The order never depends on the clock, so it takes no `now`.
 */
export const selectNextInterview = createSelector(
  [selectApplicationsByStage, selectPrepSummaryByApplication],
  (byStage, prepByApplication): NextInterview | undefined => {
    const ranked = byStage.interviewing
      .map((application) => ({ application, due: soonestOpenDueDate(application) }))
      .sort((a, b) => {
        if (a.due !== b.due) {
          if (a.due === undefined) return 1;
          if (b.due === undefined) return -1;
          return a.due.localeCompare(b.due);
        }
        return b.application.updatedAt.localeCompare(a.application.updatedAt);
      });
    const first = ranked[0];
    if (first === undefined) return undefined;
    return {
      application: first.application,
      ...(prepByApplication.get(first.application.id) ?? NO_PREP),
      otherCount: ranked.length - 1,
    };
  },
);
