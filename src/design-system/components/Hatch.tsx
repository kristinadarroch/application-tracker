import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';

import { makeStyles } from '../theme/makeStyles';

/** Stripe width; the pattern repeats every two stripes (hatchA, hatchB). */
const STRIPE = 10;

const useStyles = makeStyles((t) => ({
  fill: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    backgroundColor: t.color.proposal.hatchA,
  },
  stripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: STRIPE,
    backgroundColor: t.color.proposal.hatchB,
  },
}));

/**
 * "Track under construction": diagonal stripes behind a proposal's content. Built from Views
 * (a square of vertical stripes rotated 45°, clipped by the parent), sized from layout so it
 * always covers the box. Purely decorative; the parent clips it with `overflow: 'hidden'`.
 */
export function Hatch() {
  const styles = useStyles();
  const [box, setBox] = useState({ width: 0, height: 0 });
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  // A square with side w + h, centered and rotated, covers any w × h box.
  const side = Math.ceil(box.width + box.height);
  const square = useMemo<ViewStyle>(
    () => ({
      position: 'absolute',
      width: side,
      height: side,
      left: (box.width - side) / 2,
      top: (box.height - side) / 2,
      transform: [{ rotate: '45deg' }],
    }),
    [side, box.width, box.height],
  );
  const offsets = useMemo(
    () =>
      Array.from({ length: Math.ceil(side / (STRIPE * 2)) }, (_, i) => ({ left: i * STRIPE * 2 })),
    [side],
  );

  return (
    <View
      style={styles.fill}
      onLayout={onLayout}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {side > 0 ? (
        <View style={square}>
          {offsets.map((offset) => (
            <View key={offset.left} style={[styles.stripe, offset]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
