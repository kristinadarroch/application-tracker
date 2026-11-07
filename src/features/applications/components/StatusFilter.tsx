import { View } from 'react-native';

import { Chip, makeStyles, STAGE_ICONS } from '@/design-system';
import { STAGE_LABELS, STAGES, type Stage } from '@/lib/stage';

/** "all", or the one status the list is narrowed to (PIPE-8). */
export type StatusFilterValue = 'all' | Stage;

export interface StatusFilterProps {
  counts: Record<Stage, number>;
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}

const useStyles = makeStyles((t) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] },
}));

/**
 * "All" plus one chip per status that has applications, each with its count. The selected status
 * keeps its chip even after its count drops to 0, so the user can see what the list is showing.
 */
export function StatusFilter({ counts, value, onChange }: StatusFilterProps) {
  const styles = useStyles();
  const total = STAGES.reduce((sum, stage) => sum + counts[stage], 0);
  const shown = STAGES.filter((stage) => counts[stage] > 0 || stage === value);
  return (
    <View style={styles.chips}>
      <Chip label={`All · ${total}`} selected={value === 'all'} onPress={() => onChange('all')} />
      {shown.map((stage) => (
        <Chip
          key={stage}
          label={`${STAGE_LABELS[stage]} · ${counts[stage]}`}
          icon={STAGE_ICONS[stage]}
          selected={stage === value}
          onPress={() => onChange(stage)}
        />
      ))}
    </View>
  );
}
