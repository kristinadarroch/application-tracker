import { z } from 'zod';

import { DraftIdSchema } from '@/lib/ids';

/**
 * What the on-device model extracts from a job listing.
 * Optional fields use `.optional()` because the model can't emit `null` for required fields.
 */
export const ListingExtractionSchema = z.object({
  company: z
    .string()
    .describe(
      'The employer’s proper name exactly as written, e.g. Acme Health; empty string if the text never names the employer',
    ),
  role: z.string().describe('The job title exactly as written; empty string if none'),
  location: z.string().optional().describe('City, region, or Remote'),
  salary: z.string().optional().describe('Salary range as written in the listing'),
  requirements: z.array(z.string()).max(8).describe('Key requirements, short phrases'),
});

export type ListingExtraction = z.infer<typeof ListingExtractionSchema>;

/** How the Job Listing reached the app. */
export const DraftSourceSchema = z.enum(['pasted_text', 'pasted_url', 'shared']);
export type DraftSource = z.infer<typeof DraftSourceSchema>;

/** AI-extracted Application details that the user has not yet confirmed (INT-4). */
export const ApplicationDraftSchema = z.object({
  id: DraftIdSchema,
  source: DraftSourceSchema,
  listingUrl: z.string().optional(),
  /** Exactly what was sent to the model, after cleanup and trimming. */
  sourceText: z.string(),
  /** Starts as the model's output; the review screen saves the user's edits here. */
  extraction: ListingExtractionSchema,
  /** The user's own notes, typed during review. */
  notes: z.string(),
  /** The listing was cut to fit the model's context window (INT-5). */
  trimmed: z.boolean(),
  createdAt: z.string(),
});
export type ApplicationDraft = z.infer<typeof ApplicationDraftSchema>;

/** What the user asks intake to read: listing text, or a link to fetch first. */
export type ListingRequest =
  | { kind: 'text'; text: string; source: DraftSource; listingUrl?: string }
  | { kind: 'url'; url: string; source: DraftSource };
