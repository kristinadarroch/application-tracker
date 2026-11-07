import { View } from 'react-native';

import { Badge, Button, ListItem, makeStyles, Stack, Text } from '@/design-system';
import { assertNever } from '@/lib/assertNever';

import type { InboxMessage, TriageCandidate, TriageState } from '../schema';
import { MatchedApplication } from './MatchedApplication';
import { CATEGORY_LABELS, CATEGORY_TONES, REPLAYED_LABEL } from './triageCopy';

export interface MessageRowProps {
  message: InboxMessage;
  triage: TriageState | undefined;
  /** The application Triage matched, when it is one of the candidates. */
  matched: TriageCandidate | undefined;
  /** Whether Triage can run for this message; when it can't, the row offers "Tag manually" (UX-7). */
  canTriage: boolean;
  onOpen: () => void;
  onRetry: () => void;
}

const useStyles = makeStyles((t) => ({
  card: {
    borderRadius: t.radius.lg,
    backgroundColor: t.color.bg.surface,
    overflow: 'hidden',
  },
  status: { paddingHorizontal: t.space[4], paddingBottom: t.space[4], gap: t.space[2] },
}));

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** One Inbox Message as a white card: subject, sender, Triage status, and matched line (INBX-1). */
export function MessageRow({
  message,
  triage,
  matched,
  canTriage,
  onOpen,
  onRetry,
}: MessageRowProps) {
  const styles = useStyles();
  const showMatch =
    matched !== undefined && triage?.status === 'done' && triage.result.category !== 'unrelated';
  return (
    <View style={styles.card}>
      <ListItem
        title={message.subject.length > 0 ? message.subject : '(No subject)'}
        subtitle={`${message.fromName ?? message.from} · ${shortDate(message.receivedAt)}`}
        onPress={onOpen}
        accessibilityHint="Opens the message"
      />
      <View style={styles.status}>
        <TriageStatus triage={triage} canTriage={canTriage} onOpen={onOpen} onRetry={onRetry} />
        {showMatch ? <MatchedApplication application={matched} prefix="For" /> : null}
      </View>
    </View>
  );
}

function TriageStatus({
  triage,
  canTriage,
  onOpen,
  onRetry,
}: Pick<MessageRowProps, 'triage' | 'canTriage' | 'onOpen' | 'onRetry'>) {
  if (triage === undefined || (triage.status === 'failed' && !canTriage)) {
    return canTriage ? (
      <Text variant="board" color="tertiary">
        Waiting to analyze
      </Text>
    ) : (
      <Button label="Tag manually" variant="secondary" icon="pricetag-outline" onPress={onOpen} />
    );
  }
  switch (triage.status) {
    case 'pending':
      return (
        <Text variant="board" color="secondary">
          Analyzing…
        </Text>
      );
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
            <Badge tone="success" icon="checkmark" label="Next Step added" />
          ) : triage.decision === 'open' && triage.result.proposedNextStep !== undefined ? (
            <Badge tone="neutral" icon="construct-outline" label="Next Step proposed" />
          ) : null}
        </Stack>
      );
    case 'manual':
      return <Badge tone="success" icon="pricetag-outline" label="Tagged manually" />;
    default:
      return assertNever(triage);
  }
}
