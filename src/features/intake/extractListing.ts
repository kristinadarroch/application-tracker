import type { AppError } from '@/lib/errors';
import { createId, DraftIdSchema } from '@/lib/ids';
import { err, ok, type Result } from '@/lib/result';
import { inputTokenBudget, trimToTokenBudget } from '@/services/ai/budget';
import type { OnDeviceModel } from '@/services/ai/model';

import { fetchListing } from './fetchListing';
import {
  ListingExtractionSchema,
  type ApplicationDraft,
  type ListingExtraction,
  type ListingRequest,
} from './schema';

export const EXTRACTION_TIMEOUT_MS = 20_000;
/** A filled ListingExtraction is well under 300 tokens; the cap stops runaway generation. */
const EXTRACTION_MAX_OUTPUT_TOKENS = 400;

/** Tokens kept free for the instructions, the output schema, and the model's answer. */
const RESERVED_TOKENS = 900;

// No example names: the model copies them into listings that don't name an employer.
export const EXTRACTION_INSTRUCTIONS = [
  'You read one job listing and extract its details.',
  'Use only facts stated in the listing text. Never guess or invent.',
  'Leave a field as an empty string when the listing does not state it.',
  'company is the employer’s proper name, copied exactly from the text. It is never a sentence or a phrase about the reader. If the text never names the employer, company is an empty string.',
  'role is the job title, copied exactly from the text. If there is no job title, role is an empty string.',
  'salary is a pay amount copied from the text. If no amount is stated, salary is an empty string.',
  'requirements are up to 8 short phrases taken from the listing.',
].join('\n');

const MAX_COMPANY_WORDS = 6;
/** Sentence punctuation: `!` or `?` anywhere, or a `.` that ends one sentence before another starts ("Acme Inc." and "Booking.com" are fine). */
const SENTENCE_PUNCTUATION = /[!?]|\.\s+\S/;
/** "We're looking for…", "You'll join…", "Our team…": prose about the reader, not an employer's name. */
const PRONOUN_START = /^(?:we|you|our|your|us)\b/i;
/** A lone lowercase word ("mobile") is a topic, not a job title. */
const LOWERCASE_SINGLE_WORD = /^[^\sA-Z]+$/;

/**
 * Blanks a company or role that can't be a real one. The small on-device model sometimes
 * copies a phrase from the text instead of leaving a field empty (e.g. company
 * "We're looking for someone passionate about mobile", role "mobile"). Blanking them sends
 * the user to "Couldn't find the company or role" (INT-2) instead of a wrong draft.
 */
export function withoutImplausibleNames(extraction: ListingExtraction): ListingExtraction {
  const { company, role } = extraction;
  const implausibleCompany =
    company.split(/\s+/).length > MAX_COMPANY_WORDS ||
    SENTENCE_PUNCTUATION.test(company) ||
    PRONOUN_START.test(company);
  return {
    ...extraction,
    company: implausibleCompany ? '' : company,
    role: LOWERCASE_SINGLE_WORD.test(role) ? '' : role,
  };
}

/** Anything that isn't a letter or digit (Latin letters with accents count as letters). */
const NON_WORD = /[^a-z0-9\u00c0-\u024f]+/g;

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(NON_WORD, ' ').trim();
}

/** Share of a role's words that must appear in the listing for the role to count as grounded. */
const MIN_ROLE_WORD_COVERAGE = 0.75;

/**
 * Keeps company, location, and salary only when they appear in the listing text, compared
 * as whole words ignoring case and punctuation; a salary also needs a digit. The small
 * on-device model sometimes invents values for a listing that doesn't state them (company
 * "Acme Tech", salary "No salary range stated"). A role is kept when at least 75% of its words
 * appear in the text, which allows light rewording ("Senior Mobile Engineer, React Native")
 * but not an invented title. Blanking a company or role sends the user to "Couldn't find the
 * company or role" (INT-2): a manual entry is safer than invented data.
 */
export function withGroundedFacts(
  extraction: ListingExtraction,
  sourceText: string,
): ListingExtraction {
  const source = ` ${normalizeForMatch(sourceText)} `;
  const appearsInSource = (value: string) => {
    const normalized = normalizeForMatch(value);
    return normalized.length > 0 && source.includes(` ${normalized} `);
  };
  const roleWords = normalizeForMatch(extraction.role)
    .split(' ')
    .filter((word) => word.length > 0);
  const groundedRoleWords = roleWords.filter((word) => source.includes(` ${word} `));
  const roleIsGrounded =
    roleWords.length > 0 && groundedRoleWords.length / roleWords.length >= MIN_ROLE_WORD_COVERAGE;
  const { location, salary, ...rest } = extraction;
  return {
    ...rest,
    company: appearsInSource(extraction.company) ? extraction.company : '',
    role: roleIsGrounded ? extraction.role : '',
    ...(location !== undefined && appearsInSource(location) ? { location } : {}),
    ...(salary !== undefined && /\d/.test(salary) && appearsInSource(salary) ? { salary } : {}),
  };
}

/**
 * `drafted`: ready for review. `missing_company_or_role`: the model answered but
 * couldn't find the essentials, so the user edits the text or fills the form by hand (INT-2).
 */
export type ExtractionOutcome =
  | { status: 'drafted'; draft: ApplicationDraft }
  | { status: 'missing_company_or_role'; extraction: ListingExtraction; sourceText: string };

export interface ExtractListingOptions {
  signal?: AbortSignal;
  now?: Date;
}

/** Trims whitespace and drops empty optional fields, so "" never reaches the draft. */
function cleanExtraction(raw: ListingExtraction): ListingExtraction {
  const location = raw.location?.trim() ?? '';
  const salary = raw.salary?.trim() ?? '';
  return {
    company: raw.company.trim(),
    role: raw.role.trim(),
    ...(location.length > 0 ? { location } : {}),
    ...(salary.length > 0 ? { salary } : {}),
    requirements: raw.requirements.map((item) => item.trim()).filter((item) => item.length > 0),
  };
}

/**
 * Intake pipeline: fetch the page (links only) → trim to the context budget →
 * on-device extraction → Application Draft. AI output only ever becomes a draft.
 */
export async function extractListing(
  model: OnDeviceModel,
  request: ListingRequest,
  { signal, now = new Date() }: ExtractListingOptions = {},
): Promise<Result<ExtractionOutcome, AppError>> {
  let listingText: string;
  let listingUrl: string | undefined;
  if (request.kind === 'url') {
    const page = await fetchListing(request.url, signal === undefined ? {} : { signal });
    if (!page.ok) return page;
    listingText = page.value;
    listingUrl = request.url;
  } else {
    listingText = request.text;
    listingUrl = request.listingUrl;
  }

  const { text, trimmed } = trimToTokenBudget(listingText, inputTokenBudget(RESERVED_TOKENS));
  if (text.length === 0) {
    return ok({
      status: 'missing_company_or_role',
      extraction: { company: '', role: '', requirements: [] },
      sourceText: text,
    });
  }

  const result = await model.generate({
    instructions: EXTRACTION_INSTRUCTIONS,
    prompt: `Job listing:\n${text}`,
    schema: ListingExtractionSchema,
    timeoutMs: EXTRACTION_TIMEOUT_MS,
    maxOutputTokens: EXTRACTION_MAX_OUTPUT_TOKENS,
    sampling: 'repeatable',
  });
  if (!result.ok) return err(result.error);

  const extraction = withGroundedFacts(
    withoutImplausibleNames(cleanExtraction(result.value)),
    text,
  );
  if (extraction.company.length === 0 || extraction.role.length === 0) {
    return ok({ status: 'missing_company_or_role', extraction, sourceText: text });
  }
  return ok({
    status: 'drafted',
    draft: {
      id: createId(DraftIdSchema, 'draft'),
      source: request.source,
      ...(listingUrl === undefined ? {} : { listingUrl }),
      sourceText: text,
      extraction,
      notes: '',
      trimmed,
      createdAt: now.toISOString(),
    },
  });
}
