import type { ViewStyle } from 'react-native';

export type ElevationLevel = 0 | 1 | 2;

export const lightElevation: Record<ElevationLevel, ViewStyle> = {
  0: {},
  1: { boxShadow: '0px 1px 3px 0px rgba(13, 16, 23, 0.10)' },
  2: { boxShadow: '0px 6px 16px 0px rgba(13, 16, 23, 0.16)' },
};

/** Dark theme drops shadows; surfaces separate by `bg.*` steps instead. */
export const darkElevation: Record<ElevationLevel, ViewStyle> = { 0: {}, 1: {}, 2: {} };
