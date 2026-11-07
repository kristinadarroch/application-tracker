import { View } from 'react-native';

import { makeStyles, StationMarker, Text } from '@/design-system';
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
  /** Empty stations collapse to a compact row so filled ones stay in view (PIPE-1). */
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: t.space[2],
    paddingVertical: t.space[1],
  },
}));

/** One station section in "Your lines", announced as "Saved, 2 applications". */
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
      <StationMarker stage={stage} state={count === 0 ? 'future' : 'passed'} />
      <Text variant="station" color={count === 0 ? 'tertiary' : 'primary'}>
        {label}
      </Text>
      <Text variant="board" color={count === 0 ? 'tertiary' : 'secondary'}>
        {String(count)}
      </Text>
    </View>
  );
}
