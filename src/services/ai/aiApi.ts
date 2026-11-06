import { createApi, fakeBaseQuery, type CombinedState } from '@reduxjs/toolkit/query/react';

import type { AppError } from '@/lib/errors';

/**
 * RTK Query owns request lifecycle (loading, error, dedupe) for AI tasks.
 * Each feature adds its endpoints with `aiApi.injectEndpoints` and calls the
 * on-device model from a `queryFn`, returning `{ data }` or `{ error: AppError }`.
 */
export const aiApi = createApi({
  reducerPath: 'aiApi',
  baseQuery: fakeBaseQuery<AppError>(),
  endpoints: () => ({}),
});

/** Request cache state; endpoints are injected per feature, so the definitions map is open. */
export type AiApiState = CombinedState<Record<string, never>, never, 'aiApi'>;
