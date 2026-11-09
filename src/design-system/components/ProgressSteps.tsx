import { useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';

import { makeStyles } from '../theme/makeStyles';

export interface ProgressStepsProps {
  total: number;
  done: number;
}

const HEIGHT = 14;
const STEP = 8;
const CURRENT_STEP = 12;

const useStyles = makeStyles((t) => ({
  track: { height: HEIGHT, justifyContent: 'center', marginHorizontal: t.space[2] },
  base: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (HEIGHT - 4) / 2,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.color.stage.future,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: (HEIGHT - 6) / 2,
    height: 6,
    borderRadius: 3,
    backgroundColor: t.color.urgent.bg,
  },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  done: { width: STEP, height: STEP, borderRadius: STEP / 2, backgroundColor: t.color.urgent.bg },
  current: {
    width: CURRENT_STEP,
    height: CURRENT_STEP,
    borderRadius: CURRENT_STEP / 2,
    borderWidth: 2,
    borderColor: t.color.panel.fg,
    backgroundColor: t.color.panel.bg,
  },
  future: {
    width: STEP,
    height: STEP,
    borderRadius: STEP / 2,
    borderWidth: 2,
    borderColor: t.color.panel.fgSecondary,
    backgroundColor: t.color.panel.bg,
  },
}));

/**
 * Practice progress as a row of steps, for dark panels: practiced steps filled yellow,
 * the current step an ink ring, the rest hollow. Announced as "6 of 20 practiced".
 */
export function ProgressSteps({ total, done }: ProgressStepsProps) {
  const styles = useStyles();
  const count = Math.max(0, Math.floor(total));
  const reached = Math.min(Math.max(0, Math.floor(done)), count);
  // The yellow track runs to the last practiced step; steps are spread edge to edge.
  const fillWidth = useMemo<ViewStyle>(
    () => ({ width: `${count > 1 && reached > 0 ? ((reached - 1) / (count - 1)) * 100 : 0}%` }),
    [count, reached],
  );
  const steps = Array.from({ length: count }, (_, i) =>
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
      <View style={styles.steps}>
        {steps.map((style, i) => (
          // Steps are positional and never reorder, so the index is a stable key.
          <View key={i} style={style} />
        ))}
      </View>
    </View>
  );
}
