import { z } from 'zod';

import { err, ok, type Result } from '@/lib/result';
import { StageSchema } from '@/lib/stage';

import {
  ApplicationInputSchema,
  type Application,
  type ApplicationFormValues,
  type ApplicationInput,
} from './schema';

/** Form state: like `ApplicationFormValues`, but requirements are edited as one text field. */
export type ApplicationFormState = Omit<ApplicationFormValues, 'requirements'> & {
  requirements: string;
};
export type ApplicationFormField = keyof ApplicationFormState;
export type ApplicationFieldErrors = Partial<Record<ApplicationFormField, string>>;

const FORM_FIELDS = ApplicationInputSchema.keyof().options;

/** Route params are `string | string[]`; anything unexpected is dropped rather than crashing the form. */
const param = z.string().optional().catch(undefined);

/**
 * Query params accepted by `/application/new`. Intake uses them for "Fill in manually" and when
 * AI is unavailable; `aiNote` explains why AI wasn't used (UX-7).
 */
export const ApplicationPrefillSchema = z.object({
  company: param,
  role: param,
  location: param,
  salary: param,
  listingUrl: param,
  notes: param,
  stage: StageSchema.optional().catch(undefined),
  aiNote: param,
});
export type ApplicationPrefill = z.infer<typeof ApplicationPrefillSchema>;

/** Splits "React, TypeScript\nRedux" into trimmed, non-empty requirements. */
export function splitRequirements(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((requirement) => requirement.trim())
    .filter((requirement) => requirement.length > 0);
}

export function formStateFromPrefill(prefill: ApplicationPrefill): ApplicationFormState {
  return {
    company: prefill.company ?? '',
    role: prefill.role ?? '',
    location: prefill.location ?? '',
    salary: prefill.salary ?? '',
    listingUrl: prefill.listingUrl ?? '',
    notes: prefill.notes ?? '',
    stage: prefill.stage ?? 'saved',
    requirements: '',
  };
}

export function formStateFromApplication(application: Application): ApplicationFormState {
  return {
    company: application.company,
    role: application.role,
    location: application.location ?? '',
    salary: application.salary ?? '',
    listingUrl: application.listingUrl ?? '',
    notes: application.notes,
    stage: application.stage,
    requirements: application.requirements.join('\n'),
  };
}

/** Parses the form with `ApplicationInputSchema`; on failure returns the first message per field. */
export function validateApplicationForm(
  state: ApplicationFormState,
): Result<ApplicationInput, ApplicationFieldErrors> {
  const parsed = ApplicationInputSchema.safeParse({
    ...state,
    requirements: splitRequirements(state.requirements),
  });
  if (parsed.success) return ok(parsed.data);
  const { fieldErrors } = z.flattenError(parsed.error);
  const errors: ApplicationFieldErrors = {};
  for (const field of FORM_FIELDS) {
    const message = fieldErrors[field]?.[0];
    if (message !== undefined) errors[field] = message;
  }
  return err(errors);
}
