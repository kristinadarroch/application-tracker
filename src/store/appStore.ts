import { configureStore } from '@reduxjs/toolkit';
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

import { aiApi } from '@/services/ai/aiApi';

import { persistConfig } from './persistConfig';
import { rootReducer } from './store';

/** redux-persist dispatches non-serializable actions by design. */
export const PERSIST_ACTIONS = [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER];

/** The app's persisted store. Imported only by the root layout; tests use `makeStore`. */
export const store = configureStore({
  reducer: persistReducer(persistConfig, rootReducer),
  middleware: (getDefault) =>
    getDefault({ serializableCheck: { ignoredActions: PERSIST_ACTIONS } }).concat(aiApi.middleware),
});

export const persistor = persistStore(store);
