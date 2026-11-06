import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import {
  Button,
  ErrorState,
  IconButton,
  StagePill,
  Text,
  TextField,
  ThemeProvider,
} from '@/design-system';

function renderThemed(ui: ReactElement) {
  return render(<ThemeProvider preference="light">{ui}</ThemeProvider>);
}

describe('Button', () => {
  it('calls onPress when enabled', async () => {
    const onPress = jest.fn();
    await renderThemed(<Button label="Save" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled and ignores presses when disabled', async () => {
    const onPress = jest.fn();
    await renderThemed(<Button label="Save" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is busy and ignores presses while loading', async () => {
    const onPress = jest.fn();
    await renderThemed(<Button label="Save" onPress={onPress} loading />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('IconButton', () => {
  it('exposes its accessibility label', async () => {
    const onPress = jest.fn();
    await renderThemed(
      <IconButton icon="add" accessibilityLabel="Add application" onPress={onPress} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Add application' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('TextField', () => {
  it('is found by its label and shows the error text', async () => {
    await renderThemed(
      <TextField label="Company" value="" onChangeText={jest.fn()} error="Company is required" />,
    );
    expect(screen.getByLabelText('Company')).toBeOnTheScreen();
    expect(screen.getByText('Company is required')).toBeOnTheScreen();
  });

  it('reports typed text', async () => {
    const onChangeText = jest.fn();
    await renderThemed(<TextField label="Role" value="" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText('Role'), 'Engineer');
    expect(onChangeText).toHaveBeenCalledWith('Engineer');
  });
});

describe('StagePill', () => {
  it('announces the stage', async () => {
    await renderThemed(<StagePill stage="interviewing" />);
    expect(screen.getByLabelText('Stage: Interviewing')).toBeOnTheScreen();
  });
});

describe('ErrorState', () => {
  it('shows plain-language copy and Retry for a retryable error', async () => {
    const onRetry = jest.fn();
    await renderThemed(<ErrorState error={{ kind: 'network' }} onRetry={onRetry} />);
    expect(screen.getByText('You’re offline')).toBeOnTheScreen();
    expect(screen.getByText('Check your connection and try again.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides Retry when the error is not retryable', async () => {
    await renderThemed(<ErrorState error={{ kind: 'context_too_long' }} onRetry={jest.fn()} />);
    expect(screen.getByText('Too much text')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('hides Retry when no onRetry is given', async () => {
    await renderThemed(<ErrorState error={{ kind: 'network' }} />);
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });
});

describe('Text', () => {
  it('gives title and heading variants the header role', async () => {
    await renderThemed(
      <>
        <Text variant="title">Applications</Text>
        <Text variant="heading">This week</Text>
        <Text>Body copy</Text>
      </>,
    );
    expect(screen.getByRole('header', { name: 'Applications' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'This week' })).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Body copy' })).toBeNull();
  });
});
