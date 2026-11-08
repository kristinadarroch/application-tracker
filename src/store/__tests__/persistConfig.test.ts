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

describe('persist migration to version 3', () => {
  const v2 = { version: 2, rehydrated: false };

  it('adds an empty Email Update log and no acknowledged time-out to a version 2 inbox', () => {
    const inbox = {
      messages: { ids: [], entities: {} },
      triage: {},
      fixtureCursor: 3,
      source: 'mock',
    };
    const migrated = migrations[3]?.({ _persist: v2, inbox } as PersistedState);
    expect(migrated).toEqual({
      _persist: v2,
      inbox: { ...inbox, updates: {}, acknowledgedTimeoutAt: null },
    });
  });

  it('keeps a payload without an inbox as it is', () => {
    const payload = { _persist: v2, settings: { theme: 'dark', aiReplay: false } };
    expect(migrations[3]?.(payload as PersistedState)).toEqual(payload);
  });
});
