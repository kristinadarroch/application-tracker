import { z } from 'zod';

import { endOfDueDate, IsoDateSchema, toIsoDate } from '@/lib/dates';
import { ApplicationIdSchema, MessageIdSchema, NextStepIdSchema } from '@/lib/ids';
import { StageSchema } from '@/lib/stage';

/** Empty or whitespace-only input becomes `undefined`. */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value));

export const NextStepSchema = z.object({
  id: NextStepIdSchema,
  title: z.string().trim().min(1),
  dueDate: IsoDateSchema,
  done: z.boolean(),
  completedAt: z.string().optional(),
  /** Typed by the user, or proposed from an Inbox Message. */
  source: z.enum(['manual', 'inbox']),
  messageId: MessageIdSchema.optional(),
});
export type NextStep = z.infer<typeof NextStepSchema>;

export const ApplicationSchema = z.object({
  id: ApplicationIdSchema,
  company: z.string().trim().min(1),
  role: z.string().trim().min(1),
  location: z.string().optional(),
  salary: z.string().optional(),
  listingUrl: z.string().optional(),
  stage: StageSchema,
  notes: z.string(),
  requirements: z.array(z.string()),
  nextSteps: z.array(NextStepSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Application = z.infer<typeof ApplicationSchema>;

/** What the add/edit form collects. Messages render under each TextField. */
export const ApplicationInputSchema = z.object({
  company: z.string().trim().min(1, 'Add the company'),
  role: z.string().trim().min(1, 'Add the role'),
  location: optionalText,
  salary: optionalText,
  listingUrl: optionalText.refine(
    (value) => value === undefined || /^https?:\/\/\S+$/i.test(value),
    'Enter a link that starts with http:// or https://',
  ),
  stage: StageSchema,
  notes: z.string().trim(),
  requirements: z.array(z.string()),
});
export type ApplicationFormValues = z.input<typeof ApplicationInputSchema>;
export type ApplicationInput = z.output<typeof ApplicationInputSchema>;

export const NextStepInputSchema = z.object({
  title: z.string().trim().min(1, 'Add a title'),
  /** The regex alone accepts dates like 2026-02-31; round-tripping through `Date` rejects them. */
  dueDate: IsoDateSchema.refine(
    (value) => toIsoDate(endOfDueDate(value)) === value,
    'Enter a real date',
  ),
});
export type NextStepInput = z.infer<typeof NextStepInputSchema>;
