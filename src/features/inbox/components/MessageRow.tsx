import { View } from 'react-native';

import {
  Badge,
  Button,
  ListItem,
  makeStyles,
  Stack,
  Text,
  useAnnounceChange,
} from '@/design-system';
import { assertNever } from '@/lib/assertNever';
import { STAGE_LABELS } from '@/lib/stage';

import type { EmailUpdate, InboxMessage, TriageCandidate, TriageState } from '../schema';
import { MatchedApplication } from './MatchedApplication';
import {
  CATEGORY_LABELS,
  CATEGORY_TONES,
  emailUpdateBadge,
  REPLAYED_LABEL,
  shortDate,
} from './triageCopy';

export interface MessageRowProps {
  message: InboxMessage;
  triage: TriageState | undefined;
  /** The application Triage matched, when it is one of the candidates. */
  matched: TriageCandidate | undefined;
  /** What this message changed by itself, if Triage was confident (INBX-7). */
  update: EmailUpdate | undefined;
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

/**
 * What to say when this row's Triage finishes or fails while the Inbox is open. Pending and the
 * user's later decisions are left out, so loading isn't narrated and Accept or Undo on the
 * message screen isn't announced a second time from the list underneath.
 */
function triageAnnouncement(
  subject: string,
  triage: TriageState | undefined,
  update: EmailUpdate | undefined,
): string | undefined {
  if (triage?.status === 'failed') return `Couldn’t analyze ${subject}`;
  if (triage?.status !== 'done') return undefined;
  const moved = update?.newStage === undefined ? '' : `. Moved to ${STAGE_LABELS[update.newStage]}`;
  return `${subject}: ${CATEGORY_LABELS[triage.result.category]}${moved}`;
}

/**
 * One Inbox Message as a white card: subject, sender, Triage status, and application (INBX-1).
 * Announces when its Triage finishes or fails, never on first render.
 */
export function MessageRow({
  message,
  triage,
  matched,
  update,
  canTriage,
  onOpen,
  onRetry,
}: MessageRowProps) {
  const styles = useStyles();
  const subject = message.subject.length > 0 ? message.subject : '(No subject)';
  useAnnounceChange(triageAnnouncement(subject, triage, update));
  const showMatch =
    matched !== undefined && triage?.status === 'done' && triage.result.category !== 'unrelated';
  return (
    <View style={styles.card}>
      <ListItem
        title={subject}
        subtitle={`${message.fromName ?? message.from} · ${shortDate(message.receivedAt)}`}
        onPress={onOpen}
        accessibilityHint="Opens the message"
      />
      <View style={styles.status} accessibilityLiveRegion="polite">
        <TriageStatus
          triage={triage}
          update={update}
          canTriage={canTriage}
          onOpen={onOpen}
          onRetry={onRetry}
        />
        {showMatch ? <MatchedApplication application={matched} prefix="For" /> : null}
      </View>
    </View>
  );
}

function TriageStatus({
  triage,
  update,
  canTriage,
  onOpen,
  onRetry,
}: Pick<MessageRowProps, 'triage' | 'update' | 'canTriage' | 'onOpen' | 'onRetry'>) {
  if (triage === undefined || (triage.status === 'failed' && !canTriage)) {
    return canTriage ? (
      <Text variant="mono" color="tertiary">
        Waiting to analyze
      </Text>
    ) : (
      <Button label="Tag manually" variant="secondary" icon="pricetag-outline" onPress={onOpen} />
    );
  }
  switch (triage.status) {
    case 'pending':
      return (
        <Text variant="mono" color="secondary">
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
          <DecisionBadge triage={triage} update={update} />
        </Stack>
      );
    case 'manual':
      return <Badge tone="success" icon="pricetag-outline" label="Tagged manually" />;
    default:
      return assertNever(triage);
  }
}

/** What happened to the proposal: added, proposed, or updated by itself (INBX-2, INBX-7). */
function DecisionBadge({
  triage,
  update,
}: {
  triage: Extract<TriageState, { status: 'done' }>;
  update: EmailUpdate | undefined;
}) {
  switch (triage.decision) {
    case 'open':
      return triage.result.proposedNextStep === undefined ? null : (
        <Badge tone="neutral" icon="construct-outline" label="Next Step proposed" />
      );
    case 'accepted':
      return (
        <Badge
          tone="success"
          icon="checkmark"
          label={triage.result.proposedNextStep === undefined ? 'Accepted' : 'Next Step added'}
        />
      );
    case 'auto_applied':
    case 'undone':
      return update === undefined ? null : (
        <Badge
          tone={triage.decision === 'undone' ? 'neutral' : 'success'}
          icon={triage.decision === 'undone' ? 'arrow-undo-outline' : 'checkmark'}
          label={emailUpdateBadge(update)}
        />
      );
    case 'dismissed':
      return null;
    default:
      return assertNever(triage.decision);
  }
}
