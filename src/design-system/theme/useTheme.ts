import { useContext } from 'react';

import type { Theme } from './theme';
import { ThemeContext } from './ThemeProvider';

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === null) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return theme;
}
