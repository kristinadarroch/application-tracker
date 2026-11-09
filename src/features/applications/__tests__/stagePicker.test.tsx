import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/design-system';

import { StagePicker } from '../components/StagePicker';

function renderPicker(onChange = jest.fn()) {
  return render(
    <ThemeProvider preference="light">
      <StagePicker label="Stage" value="saved" onChange={onChange} />
    </ThemeProvider>,
  );
}

describe('StagePicker (WCAG 1.3.1)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('on Android, is a radio group named "Stage" with the current Stage checked', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    await renderPicker();
    expect(screen.getByRole('radiogroup', { name: 'Stage' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Saved', checked: true })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Applied', checked: false })).toBeOnTheScreen();
  });

  it('on iOS, names the group in each chip hint and reports the picked Stage', async () => {
    const onChange = jest.fn();
    await renderPicker(onChange);
    expect(screen.getByRole('radio', { name: 'Saved', checked: true })).toHaveProp(
      'accessibilityHint',
      'Stage',
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Interviewing' }));
    expect(onChange).toHaveBeenCalledWith('interviewing');
  });
});
