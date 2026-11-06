import { assertNever } from '@/lib/assertNever';
import type { AppError } from '@/lib/errors';

import type { ListingExtraction } from './schema';

/**
 * What the intake screen offers after a failure.
 * `paste_text`: the page couldn't be loaded, so switch to paste mode and keep the link (INT-3, INT-5).
 * `retry_or_manual`: show the error with Retry and "Fill in manually" (INT-5).
 */
export type IntakeRecovery = 'paste_text' | 'retry_or_manual';

export function recoveryFor(error: AppError): IntakeRecovery {
  switch (error.kind) {
    case 'listing_unreadable':
    case 'network':
      return 'paste_text';
    case 'timeout':
    case 'invalid_response':
    case 'ai_failed':
    case 'ai_unavailable':
    case 'context_too_long':
    case 'content_blocked':
    case 'not_found':
      return 'retry_or_manual';
    default:
      return assertNever(error);
  }
}

export interface ManualPrefill {
  /** Pasted listing text; becomes the application's notes. */
  text: string;
  url: string;
  /** Whatever the model did find, so the user only types what's missing. */
  extraction?: ListingExtraction;
  /** Why AI wasn't used, shown at the top of the manual form (UX-7). */
  aiNote?: string;
}

/** Query params for `/application/new`. Empty values are left out so the form shows its own defaults. */
export function manualFormParams({
  text,
  url,
  extraction,
  aiNote,
}: ManualPrefill): Record<string, string> {
  const candidates: Record<string, string | undefined> = {
    company: extraction?.company,
    role: extraction?.role,
    location: extraction?.location,
    salary: extraction?.salary,
    listingUrl: url,
    notes: text,
    aiNote,
  };
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(candidates)) {
    const trimmed = value?.trim() ?? '';
    if (trimmed.length > 0) params[key] = trimmed;
  }
  return params;
}
