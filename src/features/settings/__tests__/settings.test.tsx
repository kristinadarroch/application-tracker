import { fireEvent, screen } from 'expo-router/testing-library';

import { selectAllApplications } from '@/features/applications/model';
import { renderApp } from '@/test/renderApp';

import { selectAiReplay, selectThemePreference } from '../slice';

describe('Settings', () => {
  it('opens from the pipeline header', async () => {
    const { getPathname } = await renderApp('/');
    await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
    expect(getPathname()).toBe('/settings');
  });

  it('changes the theme preference (UX-1)', async () => {
    const { store } = await renderApp('/settings');
    expect(screen.getByRole('button', { name: 'System' })).toBeSelected();

    await fireEvent.press(screen.getByRole('button', { name: 'Dark' }));
    expect(selectThemePreference(store.getState())).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dark' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'System' })).not.toBeSelected();
  });

  it('explains why AI is unavailable (UX-7)', async () => {
    await renderApp('/settings', {
      preloadedState: {
        capabilities: { ai: { status: 'unavailable', reason: 'unsupported_platform' } },
      },
    });
    expect(screen.getByText('AI isn’t available')).toBeOnTheScreen();
    expect(screen.getByText(/isn’t available on this device/)).toBeOnTheScreen();
  });

  it('shows when AI is available', async () => {
    await renderApp('/settings', {
      preloadedState: { capabilities: { ai: { status: 'available', contextTokens: 4096 } } },
    });
    expect(screen.getByText('AI is available')).toBeOnTheScreen();
  });

  it('toggles AI Replay in development builds', async () => {
    const { store } = await renderApp('/settings');
    await fireEvent(screen.getByRole('switch', { name: 'AI Replay' }), 'valueChange', true);
    expect(selectAiReplay(store.getState())).toBe(true);
  });

  it('loads the demo applications once, skipping companies that already exist', async () => {
    const { store } = await renderApp('/settings');
    await fireEvent.press(screen.getByRole('button', { name: 'Load demo data' }));
    expect(screen.getByText('Added 3 demo applications')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Load demo data' }));
    expect(screen.getByText('Demo data is already loaded')).toBeOnTheScreen();

    const applications = selectAllApplications(store.getState());
    expect(applications.map((a) => `${a.company} – ${a.stage}`).sort()).toEqual([
      'Acme Health – interviewing',
      'Globex – saved',
      'Northwind Labs – applied',
    ]);
  });
});
