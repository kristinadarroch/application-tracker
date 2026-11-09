import { fireEvent, screen } from 'expo-router/testing-library';

import { renderApp } from '@/test/renderApp';

describe('Back on a screen opened from a link', () => {
  it('goes to the inbox when there is no screen to return to', async () => {
    const { getPathname } = await renderApp('/inbox/msg_missing');
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(getPathname()).toBe('/inbox');
  });
});
