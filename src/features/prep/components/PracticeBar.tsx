import { View } from 'react-native';

import { makeStyles, type AccentIndex } from '@/design-system';

export interface PracticeBarProps {
  accent: AccentIndex;
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
  segment: { flex: 1, backgroundColor: t.color.stage.future },
  empty: { flex: 1, backgroundColor: t.color.border.subtle },
  accent0: { backgroundColor: t.color.accent[0].bg },
  accent1: { backgroundColor: t.color.accent[1].bg },
  accent2: { backgroundColor: t.color.accent[2].bg },
  accent3: { backgroundColor: t.color.accent[3].bg },
}));

const ACCENT_STYLE = ['accent0', 'accent1', 'accent2', 'accent3'] as const;

/**
 * Thin practice bar in the application's accent color: one segment per prep question, practiced
 * segments filled. Decorative; the row's label carries the numbers.
 */
export function PracticeBar({ accent, practiced, total }: PracticeBarProps) {
  const styles = useStyles();
  const fill = styles[ACCENT_STYLE[accent]];
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
