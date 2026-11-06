import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AiAvailability } from '@/services/ai/model';

export interface CapabilitiesState {
  /** `null` until checked at launch. Not persisted: Apple Intelligence can be turned on or off at any time. */
  ai: AiAvailability | null;
}

const initialState: CapabilitiesState = { ai: null };

export const capabilitiesSlice = createSlice({
  name: 'capabilities',
  initialState,
  reducers: {
    aiAvailabilityChecked(state, action: PayloadAction<AiAvailability>) {
      state.ai = action.payload;
    },
  },
  selectors: {
    selectAiAvailability: (state) => state.ai,
  },
});

export const { aiAvailabilityChecked } = capabilitiesSlice.actions;
export const { selectAiAvailability } = capabilitiesSlice.selectors;
