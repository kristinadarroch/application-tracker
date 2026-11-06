/**
 * Pipeline stages in display order. Shared by the domain schema
 * (`z.enum(STAGES)`) and the design system's stage tokens, so neither
 * has to import the other.
 */
export const STAGES = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};
