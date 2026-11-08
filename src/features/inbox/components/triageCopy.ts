import type { BadgeTone } from '@/design-system';
import { STAGE_LABELS } from '@/lib/stage';

import type { EmailUpdate, TriageCategory } from '../schema';

export const CATEGORY_LABELS: Record<TriageCategory, string> = {
  interview_invite: 'Interview invite',
  scheduling: 'Scheduling',
  take_home: 'Take-home',
  rejection: 'Rejection',
  offer: 'Offer',
  recruiter_followup: 'Recruiter follow-up',
  unrelated: 'Unrelated',
};

export const CATEGORY_TONES: Record<TriageCategory, BadgeTone> = {
  interview_invite: 'info',
  scheduling: 'info',
  take_home: 'info',
  rejection: 'neutral',
  offer: 'success',
  recruiter_followup: 'info',
  unrelated: 'neutral',
};

/** Shown on every replayed result so it's never mistaken for live AI output (INBX-6). */
export const REPLAYED_LABEL = 'Replayed';

/** Title of the panel and log that show what an email changed by itself (ADR 0007). */
export const UPDATED_FROM_EMAIL = 'Updated from email';

/** The Inbox row badge for an Email Update (INBX-7). */
export function emailUpdateBadge(update: EmailUpdate): string {
  if (update.undoneAt !== undefined) return 'Update undone';
  return update.newStage === undefined
    ? 'Updated: Next Step added'
    : `Updated: ${STAGE_LABELS[update.newStage]}`;
}

/** What an Email Update changed, one line per change. */
export function describeEmailUpdate(update: EmailUpdate): string[] {
  return [
    ...(update.newStage === undefined
      ? []
      : [`Stage: ${STAGE_LABELS[update.previousStage]} → ${STAGE_LABELS[update.newStage]}`]),
    ...(update.nextStepTitle === undefined ? [] : [`Next Step added: ${update.nextStepTitle}`]),
  ];
}

/** "Nov 5" in the user's locale. */
export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
