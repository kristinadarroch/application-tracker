import { createSlice } from '@reduxjs/toolkit';

/** Placeholder: the intake feature replaces this with the Application Draft entity state. */
export type DraftsState = Record<string, never>;

export const draftsSlice = createSlice({
  name: 'drafts',
  initialState: {} as DraftsState,
  reducers: {},
});
