import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createMigrate,
  type MigrationManifest,
  type PersistConfig,
  type PersistedState,
} from 'redux-persist';

import { PERSISTED_SLICES, type RootState } from './store';

/**
 * Version 2 replaced the tier 0 placeholder slices (drafts, inbox, prep) with real state.
 * Data persisted by version 1 builds keeps only `settings` and `applications`.
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
};

export const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  version: 2,
  storage: AsyncStorage,
  whitelist: PERSISTED_SLICES,
  migrate: createMigrate(migrations, { debug: false }),
};
