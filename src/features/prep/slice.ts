import { createSlice } from '@reduxjs/toolkit';

/** Placeholder: the prep feature replaces this with question sets and mock interview sessions. */
export type PrepState = Record<string, never>;

export const prepSlice = createSlice({
  name: 'prep',
  initialState: {} as PrepState,
  reducers: {},
});
