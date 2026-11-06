import type { ViewStyle } from 'react-native';

import { darkElevation, lightElevation, type ElevationLevel } from '../tokens/elevation';
import { motion, reducedMotion, type Motion } from '../tokens/motion';
import { radii } from '../tokens/radii';
import { darkColors, lightColors, type SemanticColors } from '../tokens/semantic';
import { sizing } from '../tokens/sizing';
import { space } from '../tokens/spacing';
import { maxFontSizeMultiplier, typography } from '../tokens/typography';

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = ColorScheme | 'system';

export interface Theme {
  scheme: ColorScheme;
  color: SemanticColors;
  space: typeof space;
  radius: typeof radii;
  size: typeof sizing;
  type: typeof typography;
  maxFontSizeMultiplier: typeof maxFontSizeMultiplier;
  elevation: Record<ElevationLevel, ViewStyle>;
  /** Durations in ms; all 0 when Reduce Motion is on. */
  motion: Motion;
  reduceMotion: boolean;
}

export function createTheme(scheme: ColorScheme, reduceMotion: boolean): Theme {
  return {
    scheme,
    color: scheme === 'dark' ? darkColors : lightColors,
    space,
    radius: radii,
    size: sizing,
    type: typography,
    maxFontSizeMultiplier,
    elevation: scheme === 'dark' ? darkElevation : lightElevation,
    motion: reduceMotion ? reducedMotion : motion,
    reduceMotion,
  };
}
