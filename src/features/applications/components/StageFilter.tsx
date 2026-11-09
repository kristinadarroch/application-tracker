import { Chip, ChipGroup, STAGE_ICONS } from '@/design-system';
import { STAGE_LABELS, STAGES, type Stage } from '@/lib/stage';

/** "all", or the one Stage the list is narrowed to (PIPE-8). */
export type StageFilterValue = 'all' | Stage;

export interface StageFilterProps {
  counts: Record<Stage, number>;
  value: StageFilterValue;
  onChange: (value: StageFilterValue) => void;
}

/**
 * "All" plus one chip per Stage that has applications, each with its count. The selected Stage
 * keeps its chip even after its count drops to 0, so the user can see what the list is showing.
 */
export function StageFilter({ counts, value, onChange }: StageFilterProps) {
  const total = STAGES.reduce((sum, stage) => sum + counts[stage], 0);
  const shown = STAGES.filter((stage) => counts[stage] > 0 || stage === value);
  return (
    <ChipGroup label="Filter by stage">
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
    </ChipGroup>
  );
}
