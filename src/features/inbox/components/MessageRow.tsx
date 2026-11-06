import { View } from 'react-native';

import { Badge, Button, ListItem, makeStyles, Stack } from '@/design-system';
import { assertNever } from '@/lib/assertNever';

import type { InboxMessage, TriageState } from '../schema';
import { CATEGORY_LABELS, CATEGORY_TONES, REPLAYED_LABEL } from './triageCopy';

export interface MessageRowProps {
  message: InboxMessage;
  triage: TriageState | undefined;
  /** Whether Triage can run for this message; when it can't, the row offers "Tag manually" (UX-7). */
  canTriage: boolean;
  onOpen: () => void;
  onRetry: () => void;
}

const useStyles = makeStyles((t) => ({
  row: {
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.color.border.subtle,
    backgroundColor: t.color.bg.surface,
    overflow: 'hidden',
  },
  status: { paddingHorizontal: t.space[4], paddingBottom: t.space[3] },
}));

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** One Inbox Message: sender, subject, and Triage status (INBX-1). */
export function MessageRow({ message, triage, canTriage, onOpen, onRetry }: MessageRowProps) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <ListItem
        title={message.subject.length > 0 ? message.subject : '(No subject)'}
        subtitle={`${message.fromName ?? message.from} · ${shortDate(message.receivedAt)}`}
        onPress={onOpen}
        accessibilityHint="Opens the message"
      />
      <View style={styles.status}>
        <TriageStatus triage={triage} canTriage={canTriage} onOpen={onOpen} onRetry={onRetry} />
      </View>
    </View>
  );
}

function TriageStatus({ triage, canTriage, onOpen, onRetry }: Omit<MessageRowProps, 'message'>) {
  if (triage === undefined || (triage.status === 'failed' && !canTriage)) {
    return canTriage ? (
      <Badge tone="neutral" label="Waiting to analyze" />
    ) : (
      <Button label="Tag manually" variant="secondary" icon="pricetag-outline" onPress={onOpen} />
    );
  }
  switch (triage.status) {
    case 'pending':
      return <Badge tone="info" label="Analyzing…" />;
    case 'failed':
      return (
        <Stack direction="row" gap={2} align="center" wrap="wrap">
          <Badge tone="danger" label="Couldn’t analyze" />
          <Button label="Retry" variant="secondary" icon="refresh" onPress={onRetry} />
        </Stack>
      );
    case 'done':
      return (
        <Stack direction="row" gap={2} wrap="wrap">
          <Badge
            tone={CATEGORY_TONES[triage.result.category]}
            label={CATEGORY_LABELS[triage.result.category]}
          />
          {triage.replayed ? <Badge tone="warning" label={REPLAYED_LABEL} /> : null}
          {triage.decision === 'accepted' ? (
            <Badge tone="success" label="Next Step added" />
          ) : triage.decision === 'open' && triage.result.proposedNextStep !== undefined ? (
            <Badge tone="neutral" label="Next Step proposed" />
          ) : null}
        </Stack>
      );
    case 'manual':
      return <Badge tone="success" label="Tagged manually" />;
    default:
      return assertNever(triage);
  }
}
