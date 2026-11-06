import { DraftIdSchema } from '@/lib/ids';

import {
  draftRemoved,
  draftsSlice,
  draftUpdated,
  selectAllDrafts,
  selectDraftById,
  selectDraftCount,
} from '../draftsSlice';
import { ACME_EXTRACTION, draftsState, makeDraft } from '../testing/fixtures';

const older = makeDraft({
  id: DraftIdSchema.parse('older'),
  createdAt: '2026-11-01T10:00:00.000Z',
});
const newer = makeDraft({
  id: DraftIdSchema.parse('newer'),
  createdAt: '2026-11-04T10:00:00.000Z',
  listingUrl: 'https://acme.example/jobs/42',
});

describe('drafts slice', () => {
  it('lists drafts newest first and counts them', () => {
    const state = { drafts: draftsState(older, newer) };
    expect(selectAllDrafts(state).map((draft) => draft.id)).toEqual(['newer', 'older']);
    expect(selectDraftCount(state)).toBe(2);
    expect(selectDraftById(state, older.id)).toEqual(older);
  });

  it('saves review edits and removes the link when it is cleared', () => {
    const state = draftsSlice.reducer(
      draftsState(newer),
      draftUpdated({
        id: newer.id,
        extraction: { ...ACME_EXTRACTION, role: 'Staff Engineer' },
        listingUrl: '  ',
        notes: 'Referral from Sam',
      }),
    );
    const updated = state.entities[newer.id];
    expect(updated?.extraction.role).toBe('Staff Engineer');
    expect(updated?.notes).toBe('Referral from Sam');
    expect(updated).not.toHaveProperty('listingUrl');
  });

  it('removes a draft', () => {
    const state = draftsSlice.reducer(draftsState(older, newer), draftRemoved(older.id));
    expect(selectAllDrafts({ drafts: state }).map((draft) => draft.id)).toEqual(['newer']);
  });
});
