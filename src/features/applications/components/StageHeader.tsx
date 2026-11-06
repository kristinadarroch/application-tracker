import { View } from 'react-native';

import { Badge, makeStyles, Text } from '@/design-system';
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
    paddingTop: t.space[5],
    paddingBottom: t.space[2],
  },
  /** Empty stages collapse to a compact row so filled stages stay in view (PIPE-1). */
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: t.space[2],
    paddingTop: t.space[2],
  },
}));

/** One pipeline group heading, announced as "Saved, 2 applications". */
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
      {count === 0 ? (
        <Text variant="bodySmall" color="secondary">
          {label}
        </Text>
      ) : (
        <Text variant="heading">{label}</Text>
      )}
      <Badge label={String(count)} />
    </View>
  );
}
