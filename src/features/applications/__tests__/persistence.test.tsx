import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { screen, waitFor, within } from 'expo-router/testing-library';
import { persistReducer, persistStore } from 'redux-persist';
import { z } from 'zod';

import { themePreferenceChanged } from '@/features/settings';
import { addDays, toIsoDate } from '@/lib/dates';
import { ApplicationIdSchema, NextStepIdSchema } from '@/lib/ids';
import { persistConfig } from '@/store/persistConfig';
import { rootReducer } from '@/store/store';

import { ApplicationSchema } from '../schema';
import { applicationAdded, nextStepAdded, stageChanged } from '../slice';
import { renderApp } from '@/test/renderApp';

/** redux-persist stores each whitelisted slice as a JSON string under one key. */
const StoredRootSchema = z.object({ applications: z.string(), settings: z.string() });
const StoredApplicationsSchema = z.object({
  ids: z.array(ApplicationIdSchema),
  entities: z.record(ApplicationIdSchema, ApplicationSchema),
});
const StoredSettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  aiReplay: z.boolean(),
});

describe('Keep my data (PIPE-7)', () => {
  it('restores applications, stages, Next Steps, and settings after a restart', async () => {
    // The app's persist config, with the rehydrate timeout off so no timer outlives the test.
    const store = configureStore({
      reducer: persistReducer({ ...persistConfig, timeout: 0 }, rootReducer),
      middleware: (getDefault) => getDefault({ serializableCheck: false }),
    });
    const persistor = persistStore(store);
    await waitFor(() => expect(persistor.getState().bootstrapped).toBe(true));

    const id = ApplicationIdSchema.parse('app_persisted');
    const now = new Date().toISOString();
    store.dispatch(
      applicationAdded({
        id,
        now,
        input: {
          company: 'Acme Health',
          role: 'Senior React Native Engineer',
          location: 'Austin, TX',
          salary: undefined,
          listingUrl: undefined,
          stage: 'saved',
          notes: 'Referred by Sam.',
          requirements: [],
        },
      }),
    );
    store.dispatch(stageChanged({ id, stage: 'interviewing', now }));
    store.dispatch(
      nextStepAdded({
        applicationId: id,
        id: NextStepIdSchema.parse('step_persisted'),
        title: 'Book the onsite',
        dueDate: toIsoDate(addDays(new Date(), 1)),
        source: 'manual',
        now,
      }),
    );
    store.dispatch(themePreferenceChanged('dark'));
    await persistor.flush();
    persistor.pause();

    // "Restart": read what is on disk and boot a fresh store from it.
    const raw: unknown = JSON.parse((await AsyncStorage.getItem('persist:root')) ?? '{}');
    expect(raw).not.toHaveProperty('capabilities');
    const stored = StoredRootSchema.parse(raw);
    const applications = StoredApplicationsSchema.parse(JSON.parse(stored.applications));
    const settings = StoredSettingsSchema.parse(JSON.parse(stored.settings));
    expect(settings.theme).toBe('dark');

    await renderApp('/', { preloadedState: { applications, settings } });
    const card = screen.getByRole('button', { name: /^Acme Health,/ });
    expect(card).toHaveAccessibleName(/Stage: Interviewing/);
    expect(within(card).getByText('Due tomorrow')).toBeOnTheScreen();
  });
});
