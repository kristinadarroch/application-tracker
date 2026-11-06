import { z } from 'zod';

/**
 * Pipeline stages in display order. Shared by domain schemas (`StageSchema`)
 * and the design system's stage tokens, so neither has to import the other.
 */
export const STAGES = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
] as const;

export const StageSchema = z.enum(STAGES);

export type Stage = z.infer<typeof StageSchema>;

export const STAGE_LABELS: Record<Stage, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};
