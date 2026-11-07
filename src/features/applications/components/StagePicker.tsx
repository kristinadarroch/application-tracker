import { View } from 'react-native';

import { Chip, makeStyles, STAGE_ICONS, Text } from '@/design-system';
import { STAGE_LABELS, STAGES, type Stage } from '@/lib/stage';

export interface StagePickerProps {
  label: string;
  value: Stage;
  onChange: (stage: Stage) => void;
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.space[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] },
}));

/** One chip per Stage, in pipeline order; the selected chip is announced as selected. */
export function StagePicker({ label, value, onChange }: StagePickerProps) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <Text variant="station" color="secondary">
        {label}
      </Text>
      <View style={styles.chips}>
        {STAGES.map((stage) => (
          <Chip
            key={stage}
            label={STAGE_LABELS[stage]}
            icon={STAGE_ICONS[stage]}
            selected={stage === value}
            onPress={() => onChange(stage)}
          />
        ))}
      </View>
    </View>
  );
}
