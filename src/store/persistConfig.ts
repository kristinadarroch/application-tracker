import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createMigrate,
  type MigrationManifest,
  type PersistConfig,
  type PersistedState,
} from 'redux-persist';

import type { InboxState } from '@/features/inbox/slice';

import { PERSISTED_SLICES, type RootState } from './store';

/**
 * Version 2 replaced the tier 0 placeholder slices (drafts, inbox, prep) with real state.
 * Data persisted by version 1 builds keeps only `settings` and `applications`.
 * Version 3 added Email Updates and the acknowledged Triage time-out to `inbox` (ADR 0007).
 * Persisted slices replace the initial state whole, so the new fields are filled in here.
 */
export const migrations: MigrationManifest = {
  2: (state: PersistedState) => {
    if (state === undefined) return state;
    const { _persist, settings, applications } = state as PersistedState & Partial<RootState>;
    // Only carry keys that exist: an `undefined` value would overwrite the reducer's initial state on merge.
    return {
      _persist,
      ...(settings === undefined ? {} : { settings }),
      ...(applications === undefined ? {} : { applications }),
    } as PersistedState;
  },
  3: (state: PersistedState) => {
    if (state === undefined) return state;
    const { inbox } = state as PersistedState & { inbox?: Partial<InboxState> };
    if (inbox === undefined) return state;
    return {
      ...state,
      inbox: { updates: {}, acknowledgedTimeoutAt: null, ...inbox },
    } as PersistedState;
  },
};

export const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  version: 3,
  storage: AsyncStorage,
  whitelist: PERSISTED_SLICES,
  migrate: createMigrate(migrations, { debug: false }),
};
