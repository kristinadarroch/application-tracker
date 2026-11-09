import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { Chip, ChipGroup, ThemeProvider } from '@/design-system';

function renderThemed(ui: ReactElement) {
  return render(<ThemeProvider preference="light">{ui}</ThemeProvider>);
}

function renderDue(onPress: () => void = jest.fn()) {
  return renderThemed(
    <ChipGroup label="Due">
      <Chip label="Today" selected onPress={onPress} />
      <Chip label="Tomorrow" onPress={onPress} />
    </ChipGroup>,
  );
}

describe('ChipGroup (WCAG 1.3.1)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('exposes its chips as radios with checked state', async () => {
    const onPress = jest.fn();
    await renderDue(onPress);
    expect(screen.getByRole('radio', { name: 'Today', checked: true })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Tomorrow', checked: false })).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
    await fireEvent.press(screen.getByRole('radio', { name: 'Tomorrow' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  describe('on iOS', () => {
    it('keeps the label readable and puts the group name in each chip hint', async () => {
      await renderThemed(
        <ChipGroup label="Stage">
          <Chip label="Saved" selected onPress={jest.fn()} />
          <Chip label="Applied" accessibilityHint="Moves the application" onPress={jest.fn()} />
        </ChipGroup>,
      );
      expect(screen.getByText('Stage')).toBeOnTheScreen();
      expect(screen.getByRole('radio', { name: 'Saved' })).toHaveProp('accessibilityHint', 'Stage');
      expect(screen.getByRole('radio', { name: 'Applied' })).toHaveProp(
        'accessibilityHint',
        'Stage. Moves the application',
      );
      // An accessible container would hide its chips from VoiceOver.
      expect(screen.queryByRole('radiogroup')).toBeNull();
    });

    it('marks a required group visibly and in the hint (WCAG 3.3.2)', async () => {
      await renderThemed(
        <ChipGroup label="Application" required>
          <Chip label="Acme Health — Engineer" onPress={jest.fn()} />
        </ChipGroup>,
      );
      expect(screen.getByText('· Required')).toBeOnTheScreen();
      expect(screen.getByRole('radio', { name: 'Acme Health — Engineer' })).toHaveProp(
        'accessibilityHint',
        'Application, required',
      );
    });
  });

  describe('on Android', () => {
    beforeEach(() => {
      jest.replaceProperty(Platform, 'OS', 'android');
    });

    it('is a radio group named after its label, without repeating the label', async () => {
      await renderDue();
      expect(screen.getByRole('radiogroup', { name: 'Due' })).toBeOnTheScreen();
      expect(screen.getByRole('radio', { name: 'Today', checked: true })).toBeOnTheScreen();
      expect(screen.getByRole('radio', { name: 'Today' })).not.toHaveProp('accessibilityHint');
      expect(screen.queryByText('Due')).toBeNull();
      expect(screen.getByText('Due', { includeHiddenElements: true })).toBeOnTheScreen();
    });

    it('names a required group "<label>, required" (WCAG 3.3.2)', async () => {
      await renderThemed(
        <ChipGroup label="Application" required>
          <Chip label="Acme Health — Engineer" onPress={jest.fn()} />
        </ChipGroup>,
      );
      expect(screen.getByRole('radiogroup', { name: 'Application, required' })).toBeOnTheScreen();
      expect(screen.getByText('· Required', { includeHiddenElements: true })).toBeOnTheScreen();
    });
  });

  it('leaves a chip outside any group as a selected button', async () => {
    await renderThemed(<Chip label="Today" selected onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Today' })).toBeSelected();
    expect(screen.queryByRole('radio')).toBeNull();
  });
});
