import {
  createEntityAdapter,
  createSlice,
  type EntityState,
  type PayloadAction,
} from '@reduxjs/toolkit';

import type { DraftId } from '@/lib/ids';

import type { ApplicationDraft, ListingExtraction } from './schema';

const draftsAdapter = createEntityAdapter<ApplicationDraft, DraftId>({
  selectId: (draft) => draft.id,
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

export type DraftsState = EntityState<ApplicationDraft, DraftId>;

/** The fields the user can change while reviewing. An empty `listingUrl` removes the link. */
export interface DraftEdits {
  id: DraftId;
  extraction: ListingExtraction;
  listingUrl: string;
  notes: string;
}

export const draftsSlice = createSlice({
  name: 'drafts',
  initialState: draftsAdapter.getInitialState(),
  reducers: {
    draftAdded: draftsAdapter.addOne,
    draftUpdated(state, action: PayloadAction<DraftEdits>) {
      const { id, extraction, listingUrl, notes } = action.payload;
      const draft = state.entities[id];
      if (draft === undefined) return;
      draft.extraction = extraction;
      draft.notes = notes;
      if (listingUrl.trim().length > 0) draft.listingUrl = listingUrl.trim();
      else delete draft.listingUrl;
    },
    draftRemoved: draftsAdapter.removeOne,
  },
});

export const { draftAdded, draftUpdated, draftRemoved } = draftsSlice.actions;

const selectors = draftsAdapter.getSelectors((state: { drafts: DraftsState }) => state.drafts);

/** Newest first. */
export const selectAllDrafts = selectors.selectAll;
export const selectDraftById = selectors.selectById;
export const selectDraftCount = selectors.selectTotal;
