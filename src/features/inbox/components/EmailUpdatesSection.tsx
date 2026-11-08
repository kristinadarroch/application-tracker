import { Badge, Button, Card, Stack, Text } from '@/design-system';
import type { ApplicationId } from '@/lib/ids';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import type { EmailUpdate } from '../schema';
import { selectCanUndo, selectEmailUpdatesForApplication } from '../selectors';
import { undoEmailUpdate } from '../thunks';
import { describeEmailUpdate, REPLAYED_LABEL, shortDate } from './triageCopy';

export interface EmailUpdatesSectionProps {
  applicationId: ApplicationId;
}

/**
 * "Updates from email" on the application detail: every change an email made to this application
 * by itself, newest first, with Undo while there's still something to undo (INBX-7, ADR 0007).
 * Renders nothing when no email has updated the application.
 */
export function EmailUpdatesSection({ applicationId }: EmailUpdatesSectionProps) {
  const updates = useAppSelector((state) => selectEmailUpdatesForApplication(state, applicationId));
  if (updates.length === 0) return null;
  return (
    <Card>
      <Text variant="heading">Updates from email</Text>
      {updates.map((update) => (
        <EmailUpdateEntry key={update.messageId} update={update} />
      ))}
    </Card>
  );
}

function EmailUpdateEntry({ update }: { update: EmailUpdate }) {
  const dispatch = useAppDispatch();
  const canUndo = useAppSelector((state) => selectCanUndo(state, update.messageId));
  const subject = update.subject.length > 0 ? update.subject : '(No subject)';
  return (
    <Stack gap={1}>
      <Stack direction="row" gap={2} align="center" wrap="wrap">
        <Text variant="mono" color="secondary">
          {shortDate(update.appliedAt)}
        </Text>
        {update.replayed ? <Badge tone="warning" label={REPLAYED_LABEL} /> : null}
        {update.undoneAt !== undefined ? <Badge tone="neutral" label="Undone" /> : null}
      </Stack>
      <Text variant="bodyStrong">{subject}</Text>
      {describeEmailUpdate(update).map((line) => (
        <Text key={line} color="secondary">
          {line}
        </Text>
      ))}
      {canUndo ? (
        <Button
          label="Undo"
          icon="arrow-undo-outline"
          variant="secondary"
          accessibilityHint={`Reverts the update from “${subject}”`}
          onPress={() =>
            dispatch(
              undoEmailUpdate({ messageId: update.messageId, now: new Date().toISOString() }),
            )
          }
        />
      ) : null}
    </Stack>
  );
}
