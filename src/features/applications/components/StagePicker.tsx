import { Chip, ChipGroup, STAGE_ICONS } from '@/design-system';
import { STAGE_LABELS, STAGES, type Stage } from '@/lib/stage';

export interface StagePickerProps {
  label: string;
  value: Stage;
  onChange: (stage: Stage) => void;
}

/** One chip per Stage, in pipeline order, as a radio group named after `label`. */
export function StagePicker({ label, value, onChange }: StagePickerProps) {
  return (
    <ChipGroup label={label}>
      {STAGES.map((stage) => (
        <Chip
          key={stage}
          label={STAGE_LABELS[stage]}
          icon={STAGE_ICONS[stage]}
          selected={stage === value}
          onPress={() => onChange(stage)}
        />
      ))}
    </ChipGroup>
  );
}
