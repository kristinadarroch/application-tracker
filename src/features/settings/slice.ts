import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ThemePreference } from '@/design-system';

export interface SettingsState {
  theme: ThemePreference;
  /** Dev-only: replay recorded AI results, always labeled "Replayed". */
  aiReplay: boolean;
}

const initialState: SettingsState = { theme: 'system', aiReplay: false };

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    themePreferenceChanged(state, action: PayloadAction<ThemePreference>) {
      state.theme = action.payload;
    },
    aiReplayToggled(state) {
      state.aiReplay = !state.aiReplay;
    },
  },
  selectors: {
    selectThemePreference: (state) => state.theme,
    selectAiReplay: (state) => state.aiReplay,
  },
});

export const { themePreferenceChanged, aiReplayToggled } = settingsSlice.actions;
export const { selectThemePreference, selectAiReplay } = settingsSlice.selectors;
