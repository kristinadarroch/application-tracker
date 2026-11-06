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

/** Applications that have at least one urgent open Next Step (warning badge on the pipeline card). */
export const selectUrgentApplicationIds = createSelector(
  [selectUpcomingNextSteps],
  (upcoming) => new Set(upcoming.filter((item) => item.urgent).map((item) => item.applicationId)),
);
