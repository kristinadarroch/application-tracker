import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, Stack, Text, useAnnounce } from '@/design-system';
import { STAGE_LABELS } from '@/lib/stage';

import type { EmailUpdate } from '../schema';
import { describeEmailUpdate, REPLAYED_LABEL, UPDATED_FROM_EMAIL } from './triageCopy';

export interface EmailUpdatePanelProps {
  update: EmailUpdate;
  /** Something the email changed is still there to revert. */
  canUndo: boolean;
  onUndo: () => void;
}

/** Short spoken summary of what the email changed: "Moved to Interviewing", "Next Step added: …". */
function appliedAnnouncement(update: EmailUpdate): string {
  return [
    ...(update.newStage === undefined ? [] : [`Moved to ${STAGE_LABELS[update.newStage]}`]),
    ...(update.nextStepTitle === undefined ? [] : [`Next Step added: ${update.nextStepTitle}`]),
  ].join('. ');
}

/**
 * What a confident Triage changed by itself, with one-tap Undo (INBX-7, ADR 0007). Takes the place
 * of Accept and Dismiss, because nothing is waiting for the user. Announces the change when it
 * appears and "Update undone" after Undo; an update already undone when the panel opens stays quiet.
 */
export function EmailUpdatePanel({ update, canUndo, onUndo }: EmailUpdatePanelProps) {
  const undone = update.undoneAt !== undefined;
  const [openedUndone] = useState(undone);
  useAnnounce(openedUndone ? undefined : undone ? 'Update undone' : appliedAnnouncement(update));
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
        {undone ? (
          <View accessibilityLiveRegion="polite">
            <Text color="secondary">Undone. Changes you made yourself were kept.</Text>
          </View>
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
