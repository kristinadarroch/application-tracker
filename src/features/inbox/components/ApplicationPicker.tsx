import { Badge, Chip, Stack, Text } from '@/design-system';
import type { ApplicationId } from '@/lib/ids';

import type { TriageCandidate } from '../schema';

export interface ApplicationPickerProps {
  label: string;
  applications: readonly TriageCandidate[];
  selectedId: ApplicationId | null;
  onSelect: (id: ApplicationId) => void;
  error?: string;
}

/** Choose which Application a message is about (INBX-4, INBX-5). */
export function ApplicationPicker({
  label,
  applications,
  selectedId,
  onSelect,
  error,
}: ApplicationPickerProps) {
  return (
    <Stack gap={2}>
      <Text variant="bodyStrong">{label}</Text>
      {applications.length === 0 ? (
        <Text color="secondary">
          You don’t have any applications yet. Add one from the Pipeline first.
        </Text>
      ) : (
        <Stack direction="row" gap={2} wrap="wrap">
          {applications.map((application) => (
            <Chip
              key={application.id}
              label={`${application.company} — ${application.role}`}
              selected={application.id === selectedId}
              onPress={() => onSelect(application.id)}
            />
          ))}
        </Stack>
      )}
      {error !== undefined ? <Badge tone="danger" label={error} /> : null}
    </Stack>
  );
}
