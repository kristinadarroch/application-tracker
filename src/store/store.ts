import {
  combineSlices,
  configureStore,
  createListenerMiddleware,
  type EnhancedStore,
  type ListenerMiddleware,
  type ThunkDispatch,
  type UnknownAction,
} from '@reduxjs/toolkit';

// Slices are imported directly, not through feature barrels: barrels pull in screens that import @/store/*.
import { applicationsSlice, type ApplicationsState } from '@/features/applications/slice';
import { capabilitiesSlice, type CapabilitiesState } from '@/features/capabilities/slice';
import { inboxSlice, type InboxState } from '@/features/inbox/slice';
import { draftsSlice, type DraftsState } from '@/features/intake/draftsSlice';
import { startAutoPrepListening } from '@/features/prep/autoPrep';
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

/** Slices restored on launch. `capabilities` is re-checked and `aiApi` is a request cache. */
export const PERSISTED_SLICES = [
  settingsSlice.reducerPath,
  applicationsSlice.reducerPath,
  draftsSlice.reducerPath,
  inboxSlice.reducerPath,
  prepSlice.reducerPath,
];

/** Dispatch with thunk support (RTK's default middleware). */
export type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

/** Cross-feature follow-up work (e.g. prep questions after a job is saved). One per store. */
export function createAppListeners(): ListenerMiddleware<RootState, AppDispatch> {
  const listeners = createListenerMiddleware<RootState, AppDispatch>();
  startAutoPrepListening(listeners.startListening);
  return listeners.middleware;
}

/** Store shape for tests and previews. */
export type TestStore = Omit<EnhancedStore<RootState>, 'dispatch'> & { dispatch: AppDispatch };

/**
 * Unpersisted store for tests and previews. The app's persisted singleton lives in
 * `appStore.ts`, so importing this module never starts redux-persist.
 */
export function makeStore(preloadedState?: Partial<RootState>): TestStore {
  return configureStore({
    reducer: rootReducer,
    ...(preloadedState === undefined ? {} : { preloadedState }),
    middleware: (getDefault) => getDefault().prepend(createAppListeners()).concat(aiApi.middleware),
  });
}
