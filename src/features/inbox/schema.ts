import { z } from 'zod';

import { IsoDateSchema } from '@/lib/dates';
import type { AppError } from '@/lib/errors';
import { ApplicationIdSchema, MessageIdSchema, type ApplicationId } from '@/lib/ids';

/** Where an Inbox Message came from. Gmail messages are removed when Gmail is disconnected. */
export const EmailSourceKindSchema = z.enum(['mock', 'gmail']);
export type EmailSourceKind = z.infer<typeof EmailSourceKindSchema>;

export const InboxMessageSchema = z.object({
  id: MessageIdSchema,
  from: z.email(),
  fromName: z.string().min(1).optional(),
  subject: z.string(),
  /** Full ISO timestamp. */
  receivedAt: z.iso.datetime({ offset: true }),
  bodyText: z.string(),
  origin: EmailSourceKindSchema,
});
export type InboxMessage = z.infer<typeof InboxMessageSchema>;

export const TriageCategorySchema = z.enum([
  'interview_invite',
  'scheduling',
  'take_home',
  'rejection',
  'offer',
  'recruiter_followup',
  'unrelated',
]);
export type TriageCategory = z.infer<typeof TriageCategorySchema>;

export const TriageConfidenceSchema = z.enum(['high', 'low']);
export type TriageConfidence = z.infer<typeof TriageConfidenceSchema>;

export const ProposedNextStepSchema = z.object({
  title: z.string().trim().min(1),
  dueDate: IsoDateSchema,
});
export type ProposedNextStep = z.infer<typeof ProposedNextStepSchema>;

/** Validated Triage of one Inbox Message. `applicationId` is always an existing application or `null`. */
export const TriageResultSchema = z.object({
  category: TriageCategorySchema,
  applicationId: ApplicationIdSchema.nullable(),
  confidence: TriageConfidenceSchema,
  proposedNextStep: ProposedNextStepSchema.optional(),
});
export type TriageResult = z.infer<typeof TriageResultSchema>;

/** What the user did with a proposal. */
export type ProposalDecision = 'open' | 'accepted' | 'dismissed';

/**
 * Triage lifecycle for one message. A message with no entry hasn't been triaged yet.
 * `manual`: the user tagged it by hand, so it's never triaged automatically again.
 */
export type TriageState =
  | { status: 'pending'; startedAt: number }
  | { status: 'done'; result: TriageResult; replayed: boolean; decision: ProposalDecision }
  | { status: 'failed'; error: AppError }
  | { status: 'manual' };

/** An application the model may match a message to. */
export interface TriageCandidate {
  id: ApplicationId;
  company: string;
  role: string;
}
