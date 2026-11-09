import { fireEvent, render, screen } from '@testing-library/react-native';

import { SpotlightCard, ThemeProvider } from '@/design-system';

describe('SpotlightCard body and secondary action', () => {
  it('shows the body line and wires both actions', async () => {
    const onPrimary = jest.fn();
    const onSecondary = jest.fn();
    await render(
      <ThemeProvider preference="light">
        <SpotlightCard
          eyebrow="Next interview"
          title="Acme Health"
          subtitle="Senior React Native Engineer"
          body="4 of 10 questions practiced · 1 mock interview"
          action={{ label: 'Practice questions', onPress: onPrimary }}
          secondaryAction={{ label: 'Mock interview', onPress: onSecondary }}
        />
      </ThemeProvider>,
    );
    expect(screen.getByText('4 of 10 questions practiced · 1 mock interview')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Practice questions' }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(onSecondary).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Mock interview' }));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('renders a secondary action on its own', async () => {
    const onSecondary = jest.fn();
    await render(
      <ThemeProvider preference="light">
        <SpotlightCard
          eyebrow="Next interview"
          title="Acme Health"
          secondaryAction={{ label: 'Mock interview', onPress: onSecondary }}
        />
      </ThemeProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Mock interview' }));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('makes the eyebrow a header so screen readers can jump to the card (WCAG 1.3.1)', async () => {
    await render(
      <ThemeProvider preference="light">
        <SpotlightCard eyebrow="Next interview" count="1 today" title="Acme Health" />
      </ThemeProvider>,
    );
    expect(screen.getByRole('header', { name: 'Next interview' })).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: '1 today' })).toBeNull();
  });
});
