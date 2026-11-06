import type { BadgeTone } from '@/design-system';

import type { TriageCategory } from '../schema';

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
