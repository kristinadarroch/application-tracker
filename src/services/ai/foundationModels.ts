import { err } from '@/lib/result';

import type { OnDeviceModel } from './model';

/**
 * Android (and any non-iOS platform): Apple Intelligence doesn't exist here.
 * Metro picks `foundationModels.ios.ts` on iOS, so the native library is never loaded elsewhere.
 */
export const onDeviceModel: OnDeviceModel = {
  availability: () => ({ status: 'unavailable', reason: 'unsupported_platform' }),
  generate: async () => err({ kind: 'ai_unavailable', reason: 'unsupported_platform' }),
};
