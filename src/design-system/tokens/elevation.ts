import type { ViewStyle } from 'react-native';

export type ElevationLevel = 0 | 1 | 2;

/** Transit is flat: white cards on the platform gray. Only floating controls cast a shadow. */
export const lightElevation: Record<ElevationLevel, ViewStyle> = {
  0: {},
  1: {},
  2: { boxShadow: '0px 6px 20px 0px rgba(18, 20, 23, 0.18)' },
};

/** Dark theme drops shadows; surfaces separate by `bg.*` steps instead. */
export const darkElevation: Record<ElevationLevel, ViewStyle> = { 0: {}, 1: {}, 2: {} };
