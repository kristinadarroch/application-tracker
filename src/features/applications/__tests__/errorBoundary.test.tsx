import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { ErrorBoundary } from '@/app/_layout';
import type * as StoreModule from '@/store/store';

// The boundary renders with the app's store; use an unpersisted one so no redux-persist timers start.
jest.mock('@/store/appStore', () => {
  const { makeStore } = jest.requireActual<typeof StoreModule>('@/store/store');
  return { store: makeStore(), persistor: undefined };
});

let shouldCrash = true;

function CrashingScreen() {
  if (shouldCrash) throw new Error('Render failed');
  return <Text>Recovered</Text>;
}

function RootStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

describe('Recovery screen (UX-5)', () => {
  it('replaces a crashed screen with a recovery screen whose Try again re-renders it', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await renderRouter({ _layout: { default: RootStack, ErrorBoundary }, index: CrashingScreen });

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(screen.getByText(/still saved on this device/)).toBeOnTheScreen();

    shouldCrash = false;
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Recovered')).toBeOnTheScreen();
  });
});
