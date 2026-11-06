import { z } from 'zod';

/**
 * What the on-device model extracts from a job listing.
 * Optional fields use `.optional()` because the model can't emit `null` for required fields.
 */
export const ListingExtractionSchema = z.object({
  company: z.string().describe('Hiring company name'),
  role: z.string().describe('Job title'),
  location: z.string().optional().describe('City, region, or Remote'),
  salary: z.string().optional().describe('Salary range as written in the listing'),
  requirements: z.array(z.string()).max(8).describe('Key requirements, short phrases'),
});

export type ListingExtraction = z.infer<typeof ListingExtractionSchema>;
