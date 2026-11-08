import { Badge, Button, Card, Stack, Text } from '@/design-system';

import type { EmailUpdate } from '../schema';
import { describeEmailUpdate, REPLAYED_LABEL, UPDATED_FROM_EMAIL } from './triageCopy';

export interface EmailUpdatePanelProps {
  update: EmailUpdate;
  /** Something the email changed is still there to revert. */
  canUndo: boolean;
  onUndo: () => void;
}

/**
 * What a confident Triage changed by itself, with one-tap Undo (INBX-7, ADR 0007). Takes the place
 * of Accept and Dismiss, because nothing is waiting for the user.
 */
export function EmailUpdatePanel({ update, canUndo, onUndo }: EmailUpdatePanelProps) {
  return (
    <Card variant="surface">
      <Stack gap={3}>
        <Stack direction="row" gap={2} align="center" wrap="wrap">
          <Text variant="heading">{UPDATED_FROM_EMAIL}</Text>
          {update.replayed ? <Badge tone="warning" label={REPLAYED_LABEL} /> : null}
        </Stack>
        {describeEmailUpdate(update).map((line) => (
          <Text key={line}>{line}</Text>
        ))}
        {update.undoneAt !== undefined ? (
          <Text color="secondary">Undone. Changes you made yourself were kept.</Text>
        ) : canUndo ? (
          <Button
            label="Undo"
            icon="arrow-undo-outline"
            variant="secondary"
            accessibilityHint="Puts the application back the way it was before this email"
            onPress={onUndo}
          />
        ) : (
          <Text color="secondary">Nothing left to undo: the application has changed since.</Text>
        )}
      </Stack>
    </Card>
  );
}
