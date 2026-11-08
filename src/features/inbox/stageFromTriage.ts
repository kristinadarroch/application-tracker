import type { Application } from '@/features/applications/model';
import { assertNever } from '@/lib/assertNever';
import type { Stage } from '@/lib/stage';

import type { EmailUpdate, TriageCategory } from './schema';

/** Rejected and Withdrawn: email never changes these applications on its own (ADR 0007). */
export function isClosedStage(stage: Stage): boolean {
  return stage === 'rejected' || stage === 'withdrawn';
}

/**
 * The Stage an email moves an application to, or `undefined` when the stage stays. The model only
 * classifies the email; this maps that category to a bounded transition: only forward moves,
 * except a rejection; closed applications (Rejected, Withdrawn) never move (ADR 0007).
 */
export function stageFromTriage(category: TriageCategory, current: Stage): Stage | undefined {
  if (isClosedStage(current)) return undefined;
  switch (category) {
    case 'interview_invite':
    case 'scheduling':
    case 'take_home':
      return current === 'saved' || current === 'applied' ? 'interviewing' : undefined;
    case 'offer':
      return current === 'saved' || current === 'applied' || current === 'interviewing'
        ? 'offer'
        : undefined;
    case 'rejection':
      return 'rejected';
    case 'recruiter_followup':
    case 'unrelated':
      return undefined;
    default:
      return assertNever(category);
  }
}

/** Whether this category can move some application's Stage. */
export function canChangeStage(category: TriageCategory): boolean {
  return stageFromTriage(category, 'saved') !== undefined;
}

/** What Undo would revert right now. Anything the user changed since is left alone. */
export interface UndoPlan {
  /** The application is still at the Stage the email moved it to. */
  restoreStage: boolean;
  /** The added Next Step still exists and isn't done. */
  removeStep: boolean;
}

export function undoPlan(update: EmailUpdate, application: Application | undefined): UndoPlan {
  if (update.undoneAt !== undefined || application === undefined) {
    return { restoreStage: false, removeStep: false };
  }
  const step = application.nextSteps.find((s) => s.id === update.nextStepId);
  return {
    restoreStage: update.newStage !== undefined && application.stage === update.newStage,
    removeStep: step !== undefined && !step.done,
  };
}
