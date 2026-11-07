import { View } from 'react-native';

import { makeStyles, type LineIndex } from '@/design-system';

export interface PracticeBarProps {
  line: LineIndex;
  practiced: number;
  total: number;
}

const useStyles = makeStyles((t) => ({
  track: {
    flexDirection: 'row',
    gap: t.space[1] / 2,
    height: 4,
    borderRadius: t.radius.pill,
    overflow: 'hidden',
  },
  segment: { flex: 1, backgroundColor: t.color.station.future },
  empty: { flex: 1, backgroundColor: t.color.border.subtle },
  line0: { backgroundColor: t.color.line[0].bg },
  line1: { backgroundColor: t.color.line[1].bg },
  line2: { backgroundColor: t.color.line[2].bg },
  line3: { backgroundColor: t.color.line[3].bg },
}));

const LINE_STYLE = ['line0', 'line1', 'line2', 'line3'] as const;

/**
 * Thin practice bar in the application's line color: one segment per prep question, practiced
 * segments filled. Decorative; the row's label carries the numbers.
 */
export function PracticeBar({ line, practiced, total }: PracticeBarProps) {
  const styles = useStyles();
  const fill = styles[LINE_STYLE[line]];
  return (
    <View
      style={styles.track}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {total === 0 ? (
        <View style={styles.empty} />
      ) : (
        Array.from({ length: total }, (_, index) => (
          <View key={index} style={[styles.segment, index < practiced ? fill : null]} />
        ))
      )}
    </View>
  );
}
