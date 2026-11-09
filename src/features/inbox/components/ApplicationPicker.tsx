import { View } from 'react-native';

import { Badge, Chip, ChipGroup, makeStyles, Stack, Text, useAnnounce } from '@/design-system';
import type { ApplicationId } from '@/lib/ids';

import type { TriageCandidate } from '../schema';

export interface ApplicationPickerProps {
  label: string;
  applications: readonly TriageCandidate[];
  selectedId: ApplicationId | null;
  onSelect: (id: ApplicationId) => void;
  /** Marks the choice as required: "Required" next to the label and ", required" in its name. */
  required?: boolean;
  error?: string;
}

const useStyles = makeStyles((t) => ({
  error: { paddingTop: t.space[2] },
}));

/** Choose which Application a message is about (INBX-4, INBX-5). */
export function ApplicationPicker({
  label,
  applications,
  selectedId,
  onSelect,
  required = false,
  error,
}: ApplicationPickerProps) {
  const styles = useStyles();
  // Status message (WCAG 4.1.3): VoiceOver speaks the error; TalkBack reads the live region,
  // which stays mounted so the error appearing counts as a change.
  useAnnounce(error);
  return (
    <View>
      {applications.length === 0 ? (
        <Stack gap={2}>
          <Text variant="bodyStrong">{label}</Text>
          <Text color="secondary">
            You don’t have any applications yet. Add one from the Pipeline first.
          </Text>
        </Stack>
      ) : (
        <ChipGroup label={label} required={required} labelVariant="bodyStrong">
          {applications.map((application) => (
            <Chip
              key={application.id}
              label={`${application.company} — ${application.role}`}
              selected={application.id === selectedId}
              onPress={() => onSelect(application.id)}
            />
          ))}
        </ChipGroup>
      )}
      <View accessibilityLiveRegion="polite" style={error === undefined ? null : styles.error}>
        {error !== undefined ? <Badge tone="danger" label={error} /> : null}
      </View>
    </View>
  );
}
