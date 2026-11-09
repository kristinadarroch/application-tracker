import { AccessibilityInfo, Platform, Text as RNText } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { Banner, Card, ErrorState, TextField, ThemeProvider } from '@/design-system';

function themed(ui: ReactElement) {
  return <ThemeProvider preference="light">{ui}</ThemeProvider>;
}

function spyAnnounce() {
  // Cleared too: Jest reuses the restored spy, so earlier tests' calls would carry over.
  return jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockImplementation(() => undefined)
    .mockClear();
}

afterEach(() => jest.restoreAllMocks());

it('runs as iOS, where useAnnounce speaks', () => {
  expect(Platform.OS).toBe('ios');
});

describe('TextField', () => {
  it('marks a required field visibly and in its name', async () => {
    await render(themed(<TextField label="Company" value="" onChangeText={jest.fn()} required />));
    expect(screen.getByLabelText('Company, required')).toBeOnTheScreen();
    expect(screen.getByText('· Required')).toBeOnTheScreen();
  });

  it('keeps the plain name when not required', async () => {
    await render(themed(<TextField label="Company" value="" onChangeText={jest.fn()} />));
    expect(screen.getByLabelText('Company')).toBeOnTheScreen();
    expect(screen.queryByText('· Required')).toBeNull();
  });

  it('announces a new error once', async () => {
    const announce = spyAnnounce();
    const { rerender } = await render(
      themed(<TextField label="Company" value="" onChangeText={jest.fn()} />),
    );
    expect(announce).not.toHaveBeenCalled();

    await rerender(
      themed(
        <TextField label="Company" value="" onChangeText={jest.fn()} error="Add the company" />,
      ),
    );
    await rerender(
      themed(
        <TextField label="Company" value="A" onChangeText={jest.fn()} error="Add the company" />,
      ),
    );
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Add the company');
  });
});

describe('ErrorState', () => {
  it('announces its title and short body once when it appears', async () => {
    const announce = spyAnnounce();
    await render(themed(<ErrorState error={{ kind: 'network' }} onRetry={jest.fn()} />));
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Couldn’t connect. Check your connection and try again.');
  });
});

describe('Banner', () => {
  it('does not announce an info banner on mount, but does when its title changes', async () => {
    const announce = spyAnnounce();
    const { rerender } = await render(themed(<Banner tone="info" title="AI is available" />));
    expect(announce).not.toHaveBeenCalled();

    await rerender(themed(<Banner tone="info" title="AI isn’t available" />));
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('AI isn’t available');
  });

  it('announces danger, warning, and success banners on mount', async () => {
    const announce = spyAnnounce();
    await render(
      themed(
        <>
          <Banner tone="danger" title="Couldn’t save" />
          <Banner tone="warning" title="Due soon" />
          <Banner tone="success" title="Saved" />
          <Banner tone="neutral" title="Tag messages manually" />
        </>,
      ),
    );
    expect(announce.mock.calls).toEqual([['Couldn’t save'], ['Due soon'], ['Saved']]);
  });
});

describe('Card', () => {
  it('exposes the label of a non-pressable card as one element', async () => {
    await render(
      themed(
        <Card accessibilityLabel="Analyzing message">
          <RNText>Analyzing…</RNText>
        </Card>,
      ),
    );
    expect(screen.getByLabelText('Analyzing message')).toHaveProp('accessible', true);
  });

  it('leaves an unlabelled card’s children reachable', async () => {
    await render(
      themed(
        <Card>
          <RNText>Body</RNText>
        </Card>,
      ),
    );
    expect(screen.getByText('Body')).toBeOnTheScreen();
  });
});
