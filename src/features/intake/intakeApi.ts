import { aiApi } from '@/services/ai/aiApi';
import { onDeviceModel } from '@/services/ai/foundationModels';

import { extractListing, type ExtractionOutcome } from './extractListing';
import type { ListingRequest } from './schema';

export const intakeApi = aiApi.injectEndpoints({
  endpoints: (build) => ({
    /** Reads a listing into an Application Draft. The caller stores the draft; nothing here writes `applications`. */
    extractListing: build.mutation<ExtractionOutcome, ListingRequest>({
      queryFn: async (request, { signal }) => {
        const result = await extractListing(onDeviceModel, request, { signal });
        return result.ok ? { data: result.value } : { error: result.error };
      },
    }),
  }),
});

export const { useExtractListingMutation } = intakeApi;
