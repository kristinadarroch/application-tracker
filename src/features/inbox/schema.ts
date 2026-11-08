import { z } from 'zod';

import { IsoDateSchema } from '@/lib/dates';
import type { AppError } from '@/lib/errors';
import {
  ApplicationIdSchema,
  MessageIdSchema,
  NextStepIdSchema,
  type ApplicationId,
} from '@/lib/ids';
import { StageSchema } from '@/lib/stage';

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

/**
 * What happened to a Triage's proposal. `auto_applied`: Triage was confident, so the change was
 * applied right away and recorded as an `EmailUpdate` (ADR 0007); `undone`: the user undid it.
 */
export type ProposalDecision = 'open' | 'accepted' | 'dismissed' | 'auto_applied' | 'undone';

/**
 * A change an Inbox Message made to an application on its own (ADR 0007). Kept as the log on the
 * application, and holds what Undo needs to revert exactly that change.
 */
export const EmailUpdateSchema = z.object({
  messageId: MessageIdSchema,
  applicationId: ApplicationIdSchema,
  /** Copied so the log still reads well after the message is gone (e.g. Gmail disconnected). */
  subject: z.string(),
  previousStage: StageSchema,
  /** Absent when the Stage didn't change. */
  newStage: StageSchema.optional(),
  nextStepId: NextStepIdSchema.optional(),
  nextStepTitle: z.string().optional(),
  /** Came from an AI Replay recording; always labeled as replayed. */
  replayed: z.boolean(),
  appliedAt: z.iso.datetime({ offset: true }),
  undoneAt: z.iso.datetime({ offset: true }).optional(),
});
export type EmailUpdate = z.infer<typeof EmailUpdateSchema>;

/**
 * Triage lifecycle for one message. A message with no entry hasn't been triaged yet.
 * `manual`: the user tagged it by hand, so it's never triaged automatically again.
 */
export type TriageState =
  | { status: 'pending'; startedAt: number }
  | { status: 'done'; result: TriageResult; replayed: boolean; decision: ProposalDecision }
  | { status: 'failed'; error: AppError; startedAt: number }
  | { status: 'manual' };

/** An application the model may match a message to. */
export interface TriageCandidate {
  id: ApplicationId;
  company: string;
  role: string;
}
