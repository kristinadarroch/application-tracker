import { createSlice } from '@reduxjs/toolkit';

/** Placeholder: the inbox feature replaces this with messages, triage state, and the fixture cursor. */
export type InboxState = Record<string, never>;

export const inboxSlice = createSlice({
  name: 'inbox',
  initialState: {} as InboxState,
  reducers: {},
});
