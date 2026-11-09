import { AccessibilityInfo } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { Banner, Chip, ListItem, Screen, Text, ThemeProvider } from '@/design-system';

function renderThemed(ui: ReactElement) {
  return render(<ThemeProvider preference="light">{ui}</ThemeProvider>);
}

describe('ListItem', () => {
  it('announces title and subtitle as one button and fires onPress', async () => {
    const onPress = jest.fn();
    await renderThemed(
      <ListItem title="Acme Health" subtitle="Senior React Native Engineer" onPress={onPress} />,
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Acme Health, Senior React Native Engineer' }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is not a button without onPress', async () => {
    await renderThemed(<ListItem title="Acme Health" subtitle="Austin, TX" />);
    expect(screen.getByLabelText('Acme Health, Austin, TX')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Banner', () => {
  afterEach(() => jest.restoreAllMocks());

  it('announces a success title on mount and a new title after mount', async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    const { rerender } = await renderThemed(
      <Banner tone="success" title="Saved" body="Your changes are kept." />,
    );
    expect(announce).toHaveBeenLastCalledWith('Saved');
    expect(screen.getByText('Your changes are kept.')).toBeOnTheScreen();

    await rerender(
      <ThemeProvider preference="light">
        <Banner tone="success" title="Saved again" />
      </ThemeProvider>,
    );
    expect(announce).toHaveBeenLastCalledWith('Saved again');
  });

  it('uses the alert role only for danger and fires its action', async () => {
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
    const onPress = jest.fn();
    await renderThemed(
      <>
        <Banner tone="warning" title="Due soon" />
        <Banner tone="danger" title="Couldn't save" action={{ label: 'Try again', onPress }} />
      </>,
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Chip', () => {
  it('exposes its selected state and fires onPress', async () => {
    const onPress = jest.fn();
    await renderThemed(
      <>
        <Chip label="Today" selected onPress={onPress} />
        <Chip label="Tomorrow" onPress={jest.fn()} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Today' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Tomorrow' })).not.toBeSelected();
    await fireEvent.press(screen.getByRole('button', { name: 'Today' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Screen', () => {
  it('renders a Back button when onBack is given', async () => {
    const onBack = jest.fn();
    await renderThemed(
      <Screen title="Edit application" onBack={onBack}>
        <Text>Body</Text>
      </Screen>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
