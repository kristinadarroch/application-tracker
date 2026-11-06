import { z } from 'zod';

import { addDays, toIsoDate } from '@/lib/dates';
import type { AppError } from '@/lib/errors';
import type { MessageId } from '@/lib/ids';
import { err, ok, type Result } from '@/lib/result';
import { inputTokenBudget, trimToTokenBudget } from '@/services/ai/budget';
import type { OnDeviceModel } from '@/services/ai/model';

import replayJson from './fixtures/replay.json';
import {
  TriageCategorySchema,
  TriageConfidenceSchema,
  type InboxMessage,
  type TriageCandidate,
  type TriageCategory,
  type TriageResult,
} from './schema';

/** Shared rules: 20 s for extraction and triage. */
export const TRIAGE_TIMEOUT_MS = 20_000;

/** The structured answer is a handful of short fields; the cap stops a runaway generation from blocking the queue. */
const TRIAGE_MAX_OUTPUT_TOKENS = 200;

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
 * No length or range limits here: the model doesn't always honor them, and a violation fails the
 * whole response. `toTriageResult` enforces them instead (title length, due-day range, id shape).
 */
export const TriageOutputSchema = z.object({
  matchedApplicationId: z.string().describe(`One candidate id, or "${NO_MATCH}"`),
  category: TriageCategorySchema,
  confidence: TriageConfidenceSchema.describe('low when the match is a guess'),
  nextStepTitle: z.string().optional().describe('Short action the job seeker must take, if any'),
  dueInDays: z.number().optional().describe('Days after the email date, 0 to 30'),
});

export type TriageOutput = z.infer<typeof TriageOutputSchema>;

/** Longest Next Step title kept from the model; longer ones are cut at a word boundary. */
const MAX_TITLE_LENGTH = 80;
const MAX_DUE_IN_DAYS = 30;

function shortenTitle(title: string): string {
  if (title.length <= MAX_TITLE_LENGTH) return title;
  const cut = title.slice(0, MAX_TITLE_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > MAX_TITLE_LENGTH / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Categories that always ask the job seeker to act, with the Next Step used when the model
 * leaves the title out (seen on device for an interview invite).
 */
const DEFAULT_ACTION_TITLES: Partial<Record<TriageCategory, string>> = {
  interview_invite: 'Book the interview',
  scheduling: 'Pick a time',
  take_home: 'Submit the take-home',
  recruiter_followup: 'Reply to the recruiter',
};

export const TRIAGE_INSTRUCTIONS = [
  'Triage one email for a job seeker.',
  'Pick the category. Newsletters, receipts, and anything not about a job application are unrelated.',
  `Set matchedApplicationId to the id of the candidate application the email is about, or "${NO_MATCH}". Never invent an id.`,
  'Set confidence to low when the email does not name the company or role.',
  'For interview_invite, scheduling, take_home, and recruiter_followup, always give a short nextStepTitle and dueInDays.',
  'For other categories, give them only if the email asks the job seeker to act.',
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

/** Lowercase words, with punctuation (including `.`, `-`, `@`) collapsed to single spaces. */
function normalizeWords(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Whether the message names the company: in the sender name, the sender's domain, the subject,
 * or the body, as whole words. Also matches the name written without spaces, as domains do
 * (`northwindlabs.com` for "Northwind Labs").
 */
export function mentionsCompany(message: InboxMessage, company: string): boolean {
  const name = normalizeWords(company);
  if (name.length === 0) return false;
  const domain = message.from.split('@')[1] ?? '';
  const text = normalizeWords(
    [message.fromName ?? '', domain, message.subject, message.bodyText].join(' '),
  );
  const padded = ` ${text} `;
  return padded.includes(` ${name} `) || padded.includes(` ${name.replace(/ /g, '')} `);
}

/**
 * Turns model output into a `TriageResult`. Guardrails:
 * - an id that isn't one of the candidates is an unexpected response, never a match (INBX-4);
 * - a match is kept only when the message names that company; otherwise it is unmatched and
 *   low confidence, so the user picks the application (the model guesses from weak hints);
 * - unrelated messages match nothing and propose nothing (INBX-3);
 * - a rejection is a final outcome and never proposes a Next Step;
 * - the due date counts from when the message was received.
 */
export function toTriageResult(
  output: TriageOutput,
  candidates: readonly TriageCandidate[],
  message: InboxMessage,
): Result<TriageResult, AppError> {
  // The model sometimes wraps the id in stray quotes or punctuation; ids are word characters only.
  const matched = /[A-Za-z0-9_-]+/.exec(output.matchedApplicationId)?.[0] ?? '';
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
  const grounded =
    candidate !== undefined && mentionsCompany(message, candidate.company) ? candidate : undefined;
  const result: TriageResult = {
    category: output.category,
    applicationId: grounded?.id ?? null,
    confidence: grounded === undefined ? 'low' : output.confidence,
  };
  if (output.category === 'rejection') return ok(result);
  const modelTitle = output.nextStepTitle?.trim() ?? '';
  // Action categories always propose a step; an offer only when the model gave one.
  const title =
    modelTitle.length > 0 ? shortenTitle(modelTitle) : DEFAULT_ACTION_TITLES[output.category];
  if (title === undefined) return ok(result);
  const dueInDays = Math.min(
    MAX_DUE_IN_DAYS,
    Math.max(0, Math.round(output.dueInDays ?? DEFAULT_DUE_IN_DAYS)),
  );
  const due = addDays(new Date(message.receivedAt), dueInDays);
  return ok({ ...result, proposedNextStep: { title, dueDate: toIsoDate(due) } });
}

/** Triage one message with the on-device model: prompt, structured output, then the validation above. */
export async function triageWithModel(
  model: OnDeviceModel,
  message: InboxMessage,
  candidates: readonly TriageCandidate[],
): Promise<Result<TriageResult, AppError>> {
  const generated = await model.generate({
    instructions: TRIAGE_INSTRUCTIONS,
    prompt: buildTriagePrompt(message, candidates),
    schema: TriageOutputSchema,
    timeoutMs: TRIAGE_TIMEOUT_MS,
    maxOutputTokens: TRIAGE_MAX_OUTPUT_TOKENS,
    sampling: 'repeatable',
  });
  if (!generated.ok) return generated;
  return toTriageResult(generated.value, candidates, message);
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
