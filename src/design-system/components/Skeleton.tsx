import { useEffect, useMemo, useState } from 'react';
import { Animated, type DimensionValue, type ViewStyle } from 'react-native';

import type { RadiusToken } from '../tokens/radii';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/useTheme';

export interface SkeletonProps {
  width: DimensionValue;
  height: number;
  radius?: RadiusToken;
}

const useStyles = makeStyles((t) => ({
  block: { backgroundColor: t.color.bg.subtle },
}));

const PULSE_MS = 800;

/**
 * Loading placeholder. Hidden from screen readers; the parent sets
 * `accessibilityState={{ busy: true }}`. Static when Reduce Motion is on.
 */
export function Skeleton({ width, height, radius = 'sm' }: SkeletonProps) {
  const styles = useStyles();
  const theme = useTheme();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (theme.reduceMotion) {
      opacity.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: PULSE_MS, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: PULSE_MS, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, theme.reduceMotion]);

  const size = useMemo<ViewStyle>(
    () => ({ width, height, borderRadius: theme.radius[radius] }),
    [width, height, radius, theme.radius],
  );

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, size, { opacity }]}
    />
  );
}
