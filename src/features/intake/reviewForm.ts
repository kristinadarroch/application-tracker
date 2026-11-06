import { z } from 'zod';

import {
  ApplicationInputSchema,
  type ApplicationFormValues,
  type ApplicationInput,
} from '@/features/applications/schema';
import type { DraftId } from '@/lib/ids';
import { err, ok, type Result } from '@/lib/result';

import type { DraftEdits } from './draftsSlice';
import type { ApplicationDraft } from './schema';

/** Text-field values on the draft review screen. Requirements are edited one per line. */
export interface DraftFormValues {
  company: string;
  role: string;
  location: string;
  salary: string;
  listingUrl: string;
  requirements: string;
  notes: string;
}

export type DraftFormErrors = Partial<Record<keyof DraftFormValues, string>>;

const FORM_FIELDS: readonly (keyof DraftFormValues)[] = [
  'company',
  'role',
  'location',
  'salary',
  'listingUrl',
  'requirements',
  'notes',
];

function nonEmptyLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function draftToFormValues(draft: ApplicationDraft): DraftFormValues {
  const { extraction } = draft;
  return {
    company: extraction.company,
    role: extraction.role,
    location: extraction.location ?? '',
    salary: extraction.salary ?? '',
    listingUrl: draft.listingUrl ?? '',
    requirements: extraction.requirements.join('\n'),
    notes: draft.notes,
  };
}

/** Saves in-progress edits to the draft so the user can finish reviewing later (INT-6). */
export function formValuesToEdits(id: DraftId, values: DraftFormValues): DraftEdits {
  const location = values.location.trim();
  const salary = values.salary.trim();
  return {
    id,
    extraction: {
      company: values.company,
      role: values.role,
      ...(location.length > 0 ? { location } : {}),
      ...(salary.length > 0 ? { salary } : {}),
      requirements: nonEmptyLines(values.requirements),
    },
    listingUrl: values.listingUrl,
    notes: values.notes,
  };
}

/** Same rules as the manual form (PIPE-2). A confirmed draft starts in the Saved stage. */
export function validateDraftForm(
  values: DraftFormValues,
): Result<ApplicationInput, DraftFormErrors> {
  const input: ApplicationFormValues = {
    ...values,
    stage: 'saved',
    requirements: nonEmptyLines(values.requirements),
  };
  const parsed = ApplicationInputSchema.safeParse(input);
  if (parsed.success) return ok(parsed.data);
  const { fieldErrors } = z.flattenError(parsed.error);
  const errors: DraftFormErrors = {};
  for (const key of FORM_FIELDS) {
    const message = fieldErrors[key]?.[0];
    if (message !== undefined) errors[key] = message;
  }
  return err(errors);
}
