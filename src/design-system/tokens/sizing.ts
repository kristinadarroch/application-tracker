import { Platform } from 'react-native';

/** Minimum touch target: 44 pt (Apple HIG) on iOS, 48 dp (Material) on Android. */
export function minTouchTargetFor(os: typeof Platform.OS): number {
  return os === 'android' ? 48 : 44;
}

export const sizing = {
  minTouchTarget: minTouchTargetFor(Platform.OS),
} as const;
