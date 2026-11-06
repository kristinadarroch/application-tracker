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

import { capabilitiesSlice, type CapabilitiesState } from '@/features/capabilities/slice';
import { settingsSlice, type SettingsState } from '@/features/settings/slice';

export interface RootState {
  settings: SettingsState;
  capabilities: CapabilitiesState;
}

const rootReducer = combineSlices(settingsSlice, capabilitiesSlice);

const persistedReducer = persistReducer<RootState>(
  {
    key: 'root',
    version: 1,
    storage: AsyncStorage,
    // `capabilities` is re-checked at launch, never restored.
    whitelist: [settingsSlice.reducerPath],
  },
  rootReducer,
);

export function makeStore() {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefault) =>
      getDefault({
        // redux-persist dispatches non-serializable actions by design.
        serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
      }),
  });
}

export const store = makeStore();
export const persistor = persistStore(store);

export type AppStore = typeof store;
export type AppDispatch = AppStore['dispatch'];
