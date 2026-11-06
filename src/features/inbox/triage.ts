import { z } from 'zod';

import { addDays, toIsoDate } from '@/lib/dates';
import type { AppError } from '@/lib/errors';
import type { MessageId } from '@/lib/ids';
import { err, ok, type Result } from '@/lib/result';
import { inputTokenBudget, trimToTokenBudget } from '@/services/ai/budget';

import replayJson from './fixtures/replay.json';
import {
  TriageCategorySchema,
  TriageConfidenceSchema,
  type InboxMessage,
  type TriageCandidate,
  type TriageResult,
} from './schema';

/** Shared rules: 20 s for extraction and triage. */
export const TRIAGE_TIMEOUT_MS = 20_000;

/** The model's answer for "this email isn't about any of my applications". */
export const NO_MATCH = 'none';

/** Used when the model proposes a step without a due date: inside the urgent window, so it gets attention. */
const DEFAULT_DUE_IN_DAYS = 2;

/** At most this many applications are offered as match candidates, newest first. */
export const MAX_CANDIDATES = 30;

/** Tokens kept back for instructions, the output schema, up to 30 candidates, and the response. */
const TRIAGE_RESERVED_TOKENS = 1_600;

/**
 * What the on-device model returns. Kept small (it costs tokens) and within the
 * structured-output rules: a root object, string enums, optional fields, no unions.
 */
export const TriageOutputSchema = z.object({
  matchedApplicationId: z.string().describe(`One candidate id, or "${NO_MATCH}"`),
  category: TriageCategorySchema,
  confidence: TriageConfidenceSchema.describe('low when the match is a guess'),
  nextStepTitle: z.string().max(80).optional().describe('What the job seeker must do, if anything'),
  dueInDays: z.number().int().min(0).max(30).optional().describe('Days after the email date'),
});
export type TriageOutput = z.infer<typeof TriageOutputSchema>;

export const TRIAGE_INSTRUCTIONS = [
  'Triage one email for a job seeker.',
  'Pick the category. Newsletters, receipts, and anything not about a job application are unrelated.',
  `Set matchedApplicationId to the id of the candidate application the email is about, or "${NO_MATCH}". Never invent an id.`,
  'Set confidence to low when the email does not name the company or role.',
  'If the email asks the job seeker to act, give a short next step title and the days until it is due. Otherwise omit both.',
  'Use only facts in the email.',
].join('\n');

export function buildTriagePrompt(
  message: InboxMessage,
  candidates: readonly TriageCandidate[],
): string {
  const applications =
    candidates.length === 0
      ? '(none)'
      : candidates
          .slice(0, MAX_CANDIDATES)
          .map((candidate) => `- id: ${candidate.id} | ${candidate.company} | ${candidate.role}`)
          .join('\n');
  const sender =
    message.fromName === undefined ? message.from : `${message.fromName} <${message.from}>`;
  const body = trimToTokenBudget(message.bodyText, inputTokenBudget(TRIAGE_RESERVED_TOKENS)).text;
  return [
    'Candidate applications:',
    applications,
    '',
    'Email:',
    `From: ${sender}`,
    `Subject: ${message.subject}`,
    `Date: ${message.receivedAt.slice(0, 10)}`,
    '',
    body,
  ].join('\n');
}

/**
 * Turns model output into a `TriageResult`. Guardrails:
 * - an id that isn't one of the candidates is an unexpected response, never a match (INBX-4);
 * - unrelated messages match nothing and propose nothing (INBX-3);
 * - the due date counts from when the message was received.
 */
export function toTriageResult(
  output: TriageOutput,
  candidates: readonly TriageCandidate[],
  receivedAt: string,
): Result<TriageResult, AppError> {
  const matched = output.matchedApplicationId.trim();
  const candidate = candidates.find((c) => c.id === matched);
  if (matched.toLowerCase() !== NO_MATCH && candidate === undefined) {
    return err({
      kind: 'invalid_response',
      issues: [`Matched an application that doesn't exist: "${matched}"`],
    });
  }
  if (output.category === 'unrelated') {
    return ok({ category: 'unrelated', applicationId: null, confidence: output.confidence });
  }
  const title = output.nextStepTitle?.trim() ?? '';
  const result: TriageResult = {
    category: output.category,
    applicationId: candidate?.id ?? null,
    confidence: output.confidence,
  };
  if (title.length === 0) return ok(result);
  const due = addDays(new Date(receivedAt), output.dueInDays ?? DEFAULT_DUE_IN_DAYS);
  return ok({ ...result, proposedNextStep: { title, dueDate: toIsoDate(due) } });
}

/**
 * AI Replay recordings for the sample messages. Application ids are created on each device,
 * so a recording names the matched company and is resolved against current applications.
 */
const ReplayRecordingSchema = TriageOutputSchema.omit({ matchedApplicationId: true }).extend({
  matchedCompany: z.string(),
});
const REPLAY_RECORDINGS = z.record(z.string(), ReplayRecordingSchema).parse(replayJson);

export function hasReplayRecording(messageId: MessageId): boolean {
  return messageId in REPLAY_RECORDINGS;
}

/** The recorded model output for a sample message, or `undefined` when none was recorded. */
export function replayedTriageOutput(
  messageId: MessageId,
  candidates: readonly TriageCandidate[],
): TriageOutput | undefined {
  const recording = REPLAY_RECORDINGS[messageId];
  if (recording === undefined) return undefined;
  const { matchedCompany, ...output } = recording;
  const company = matchedCompany.toLowerCase();
  const candidate = candidates.find((c) => c.company.toLowerCase() === company);
  return { ...output, matchedApplicationId: candidate?.id ?? NO_MATCH };
}
