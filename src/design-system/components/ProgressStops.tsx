import { useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';

import { makeStyles } from '../theme/makeStyles';

export interface ProgressStopsProps {
  total: number;
  done: number;
}

const HEIGHT = 14;
const STOP = 8;
const CURRENT_STOP = 12;

const useStyles = makeStyles((t) => ({
  track: { height: HEIGHT, justifyContent: 'center', marginHorizontal: t.space[2] },
  base: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (HEIGHT - 4) / 2,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.color.station.future,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: (HEIGHT - 6) / 2,
    height: 6,
    borderRadius: 3,
    backgroundColor: t.color.urgent.bg,
  },
  stops: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  done: { width: STOP, height: STOP, borderRadius: STOP / 2, backgroundColor: t.color.urgent.bg },
  current: {
    width: CURRENT_STOP,
    height: CURRENT_STOP,
    borderRadius: CURRENT_STOP / 2,
    borderWidth: 2,
    borderColor: t.color.sign.fg,
    backgroundColor: t.color.sign.bg,
  },
  future: {
    width: STOP,
    height: STOP,
    borderRadius: STOP / 2,
    borderWidth: 2,
    borderColor: t.color.sign.fgSecondary,
    backgroundColor: t.color.sign.bg,
  },
}));

/**
 * Practice loop as a line of stops, for dark sign panels (B3): practiced stops filled yellow,
 * the current stop an ink ring, the rest hollow. Announced as "6 of 20 practiced".
 */
export function ProgressStops({ total, done }: ProgressStopsProps) {
  const styles = useStyles();
  const count = Math.max(0, Math.floor(total));
  const reached = Math.min(Math.max(0, Math.floor(done)), count);
  // The yellow track runs to the last practiced stop; stops are spread edge to edge.
  const fillWidth = useMemo<ViewStyle>(
    () => ({ width: `${count > 1 && reached > 0 ? ((reached - 1) / (count - 1)) * 100 : 0}%` }),
    [count, reached],
  );
  const stops = Array.from({ length: count }, (_, i) =>
    i < reached ? styles.done : i === reached ? styles.current : styles.future,
  );
  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${reached} of ${count} practiced`}
      accessibilityValue={{ min: 0, max: count, now: reached }}
    >
      <View style={styles.base} />
      <View style={[styles.fill, fillWidth]} />
      <View style={styles.stops}>
        {stops.map((style, i) => (
          // Stops are positional and never reorder, so the index is a stable key.
          <View key={i} style={style} />
        ))}
      </View>
    </View>
  );
}
