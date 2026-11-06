import { Badge, Card, Stack, StagePill, Text } from '@/design-system';
import { STAGE_LABELS } from '@/lib/stage';

import type { Application } from '../schema';

export interface ApplicationCardProps {
  application: Application;
  /** Set when the application has an urgent open Next Step, e.g. "Due tomorrow". */
  urgentLabel: string | undefined;
  onPress: () => void;
}

/** Pipeline card. Text wraps instead of truncating so large text never hides the company, role, or stage (UX-2). */
export function ApplicationCard({ application, urgentLabel, onPress }: ApplicationCardProps) {
  const { company, role, location, stage } = application;
  const accessibilityLabel = [
    company,
    role,
    location,
    `Stage: ${STAGE_LABELS[stage]}`,
    urgentLabel === undefined ? undefined : `Urgent: ${urgentLabel}`,
  ]
    .filter((part) => part !== undefined)
    .join(', ');
  return (
    <Card
      elevated
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens the application"
    >
      <Text variant="bodyStrong">{company}</Text>
      <Text>{role}</Text>
      {location !== undefined ? (
        <Text variant="bodySmall" color="secondary">
          {location}
        </Text>
      ) : null}
      <Stack direction="row" gap={2} wrap="wrap" align="center">
        <StagePill stage={stage} />
        {urgentLabel !== undefined ? <Badge tone="warning" label={urgentLabel} /> : null}
      </Stack>
    </Card>
  );
}
