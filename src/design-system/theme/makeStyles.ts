import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import type { Theme } from './theme';
import { useTheme } from './useTheme';

type NamedStyles<T> = { [K in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Typed style factory. The returned hook builds one `StyleSheet` per theme object
 * and reuses it, so re-renders don't rebuild styles while any theme change
 * (color scheme, Reduce Motion, font scaling) does.
 */
export function makeStyles<T extends NamedStyles<T>>(
  factory: (theme: Theme) => T & NamedStyles<T>,
): () => T {
  const cache = new WeakMap<Theme, T>();
  return function useStyles(): T {
    const theme = useTheme();
    const cached = cache.get(theme);
    if (cached !== undefined) return cached;
    const styles = StyleSheet.create(factory(theme));
    cache.set(theme, styles);
    return styles;
  };
}
