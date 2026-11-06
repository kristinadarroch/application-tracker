import type { PersistedState } from 'redux-persist';

import { migrations } from '../persistConfig';

const v1 = { version: 1, rehydrated: false };

describe('persist migration to version 2', () => {
  it('keeps settings from a settings-only version 1 payload without adding empty slices', () => {
    const migrated = migrations[2]?.({
      _persist: v1,
      settings: { theme: 'dark', aiReplay: false },
    } as PersistedState);
    expect(migrated).toEqual({ _persist: v1, settings: { theme: 'dark', aiReplay: false } });
    expect(migrated).not.toHaveProperty('applications');
  });

  it('drops tier 0 placeholder slices but keeps applications', () => {
    const applications = { ids: [], entities: {} };
    const migrated = migrations[2]?.({
      _persist: v1,
      applications,
      prep: {},
      inbox: {},
      drafts: {},
    } as PersistedState);
    expect(migrated).toEqual({ _persist: v1, applications });
  });
});
