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

/** Applications that have at least one urgent open Next Step. */
export const selectUrgentApplicationIds = createSelector(
  [selectUrgentNextStepByApplication],
  (byApplication): ReadonlySet<ApplicationId> => new Set(byApplication.keys()),
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
