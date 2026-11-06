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

/** Tokens kept free for the instructions, the output schema, and the model's answer. */
const RESERVED_TOKENS = 900;

export const EXTRACTION_INSTRUCTIONS = [
  'You read one job listing and extract its details.',
  'Use only facts stated in the listing text. Never guess.',
  'Leave a field empty when the listing does not state it.',
  'company is the hiring company, not a job board or recruiter.',
  'role is the job title as written.',
  'requirements are up to 8 short phrases taken from the listing.',
].join('\n');

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
    deterministic: true,
  });
  if (!result.ok) return err(result.error);

  const extraction = cleanExtraction(result.value);
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
