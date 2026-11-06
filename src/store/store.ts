import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineSlices, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';

import { applicationsSlice, type ApplicationsState } from '@/features/applications/slice';
import { capabilitiesSlice, type CapabilitiesState } from '@/features/capabilities/slice';
import { inboxSlice, type InboxState } from '@/features/inbox/slice';
import { draftsSlice, type DraftsState } from '@/features/intake/draftsSlice';
import { prepSlice, type PrepState } from '@/features/prep/slice';
import { settingsSlice, type SettingsState } from '@/features/settings/slice';
import { aiApi, type AiApiState } from '@/services/ai/aiApi';

export interface RootState {
  settings: SettingsState;
  capabilities: CapabilitiesState;
  applications: ApplicationsState;
  drafts: DraftsState;
  inbox: InboxState;
  prep: PrepState;
  aiApi: AiApiState;
}

export const rootReducer = combineSlices(
  settingsSlice,
  capabilitiesSlice,
  applicationsSlice,
  draftsSlice,
  inboxSlice,
  prepSlice,
  aiApi,
);

const persistedReducer = persistReducer<RootState>(
  {
    key: 'root',
    version: 1,
    storage: AsyncStorage,
    // `capabilities` is re-checked at launch and `aiApi` is a request cache: neither is restored.
    whitelist: [
      settingsSlice.reducerPath,
      applicationsSlice.reducerPath,
      draftsSlice.reducerPath,
      inboxSlice.reducerPath,
      prepSlice.reducerPath,
    ],
  },
  rootReducer,
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) =>
    getDefault({
      // redux-persist dispatches non-serializable actions by design.
      serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
    }).concat(aiApi.middleware),
});
export const persistor = persistStore(store);

/** Unpersisted store for tests and previews. */
export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    ...(preloadedState === undefined ? {} : { preloadedState }),
    middleware: (getDefault) => getDefault().concat(aiApi.middleware),
  });
}

export type AppStore = typeof store;
export type AppDispatch = AppStore['dispatch'];
