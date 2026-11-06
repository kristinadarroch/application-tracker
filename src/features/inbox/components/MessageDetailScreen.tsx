import { useState } from 'react';

import { Banner, Button, Card, ErrorState, Screen, Skeleton, Stack, Text } from '@/design-system';
import { selectAiAvailability } from '@/features/capabilities/slice';
import { assertNever } from '@/lib/assertNever';
import { describeError, type AppError } from '@/lib/errors';
import type { MessageId } from '@/lib/ids';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import type { InboxMessage, TriageCandidate, TriageState } from '../schema';
import {
  selectCanTriage,
  selectMessageById,
  selectTriage,
  selectTriageCandidates,
} from '../selectors';
import { proposalDecided } from '../slice';
import { acceptProposal, startTriage, tagManually } from '../thunks';
import { ManualTagForm, type ManualTag } from './ManualTagForm';
import { ProposalCard } from './ProposalCard';

export interface MessageDetailScreenProps {
  messageId: MessageId;
  onBack: () => void;
}

/** Full Inbox Message with its Triage proposal and the manual path (INBX-2–5). */
export function MessageDetailScreen({ messageId, onBack }: MessageDetailScreenProps) {
  const message = useAppSelector((state) => selectMessageById(state, messageId));
  return (
    <Screen title="Message" onBack={onBack} scroll>
      {message === undefined ? (
        <ErrorState error={{ kind: 'not_found', entity: 'message' }} />
      ) : (
        <MessageDetail message={message} />
      )}
    </Screen>
  );
}

function MessageDetail({ message }: { message: InboxMessage }) {
  const dispatch = useAppDispatch();
  const triage = useAppSelector((state) => selectTriage(state, message.id));
  const canTriage = useAppSelector((state) => selectCanTriage(state, message.id));
  const availability = useAppSelector(selectAiAvailability);
  const applications = useAppSelector(selectTriageCandidates);
  const [tagging, setTagging] = useState(false);
  const [actionError, setActionError] = useState<AppError | null>(null);

  const onTagged = (tag: ManualTag) => {
    const result = dispatch(
      tagManually({ messageId: message.id, ...tag, now: new Date().toISOString() }),
    );
    setActionError(result.ok ? null : result.error);
    if (result.ok) setTagging(false);
  };

  const manualForm = (
    <ManualTagForm
      applications={applications}
      onSubmit={onTagged}
      {...(canTriage ? { onCancel: () => setTagging(false) } : {})}
    />
  );

  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Text variant="heading">
          {message.subject.length > 0 ? message.subject : '(No subject)'}
        </Text>
        <Text color="secondary">
          {message.fromName === undefined ? message.from : `${message.fromName} <${message.from}>`}
        </Text>
        <Text color="tertiary">{new Date(message.receivedAt).toLocaleString()}</Text>
      </Stack>

      {actionError !== null ? (
        <Banner
          tone="danger"
          title={describeError(actionError).title}
          body={describeError(actionError).body}
        />
      ) : null}

      {!canTriage && triage?.status !== 'done' && triage?.status !== 'manual' ? (
        <>
          <Banner
            tone="info"
            title="Tag this message manually"
            body={
              availability?.status === 'unavailable'
                ? describeError({ kind: 'ai_unavailable', reason: availability.reason }).body
                : 'Automatic analysis isn’t available.'
            }
          />
          {manualForm}
        </>
      ) : tagging ? (
        manualForm
      ) : (
        <TriagePanel
          triage={triage}
          applications={applications}
          onRetry={() => void dispatch(startTriage(message.id))}
          onAccept={(applicationId) => {
            const result = dispatch(
              acceptProposal({
                messageId: message.id,
                applicationId,
                now: new Date().toISOString(),
              }),
            );
            setActionError(result.ok ? null : result.error);
          }}
          onDismiss={() =>
            dispatch(proposalDecided({ messageId: message.id, decision: 'dismissed' }))
          }
          onTagManually={() => setTagging(true)}
        />
      )}

      <Card>
        <Text>{message.bodyText}</Text>
      </Card>
    </Stack>
  );
}

function TriagePanel({
  triage,
  applications,
  onRetry,
  onAccept,
  onDismiss,
  onTagManually,
}: {
  triage: TriageState | undefined;
  applications: readonly TriageCandidate[];
  onRetry: () => void;
  onAccept: (applicationId: TriageCandidate['id']) => void;
  onDismiss: () => void;
  onTagManually: () => void;
}) {
  const tagButton = (
    <Button
      label="Tag manually"
      variant="secondary"
      icon="pricetag-outline"
      onPress={onTagManually}
    />
  );
  if (triage === undefined || triage.status === 'pending') {
    return (
      <Card accessibilityLabel="Analyzing message">
        <Stack gap={2}>
          <Text color="secondary">Analyzing…</Text>
          <Skeleton width="70%" height={16} />
          <Skeleton width="45%" height={16} />
        </Stack>
      </Card>
    );
  }
  switch (triage.status) {
    case 'failed':
      return (
        <Card>
          <ErrorState error={triage.error} onRetry={onRetry} />
          {tagButton}
        </Card>
      );
    case 'done':
      return (
        <Stack gap={2}>
          <ProposalCard
            result={triage.result}
            replayed={triage.replayed}
            decision={triage.decision}
            applications={applications}
            onAccept={onAccept}
            onDismiss={onDismiss}
          />
          {triage.decision === 'accepted' ? null : tagButton}
        </Stack>
      );
    case 'manual':
      return <Banner tone="success" title="Tagged manually" body="The Next Step was added." />;
    default:
      return assertNever(triage);
  }
}
