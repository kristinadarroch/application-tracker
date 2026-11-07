import { View } from 'react-native';

import { makeStyles, StageMarker, Text } from '@/design-system';
import { STAGE_LABELS, type Stage } from '@/lib/stage';

export interface StageHeaderProps {
  stage: Stage;
  count: number;
}

const useStyles = makeStyles((t) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: t.space[2],
    paddingTop: t.space[4],
    paddingBottom: t.space[1],
    borderTopWidth: 1,
    borderTopColor: t.color.border.subtle,
  },
  /** Empty stages collapse to a compact row so filled ones stay in view (PIPE-1). */
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: t.space[2],
    paddingVertical: t.space[1],
  },
}));

/** One stage section in the applications card, announced as "Saved, 2 applications". */
export function StageHeader({ stage, count }: StageHeaderProps) {
  const styles = useStyles();
  const label = STAGE_LABELS[stage];
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={`${label}, ${count} ${count === 1 ? 'application' : 'applications'}`}
      style={count === 0 ? styles.compact : styles.header}
    >
      <StageMarker stage={stage} state={count === 0 ? 'future' : 'passed'} />
      <Text variant="overline" color={count === 0 ? 'tertiary' : 'primary'}>
        {label}
      </Text>
      <Text variant="mono" color={count === 0 ? 'tertiary' : 'secondary'}>
        {String(count)}
      </Text>
    </View>
  );
}
