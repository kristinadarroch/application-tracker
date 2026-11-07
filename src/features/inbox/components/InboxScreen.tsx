import { FlatList } from 'react-native';

import { Banner, Button, EmptyState, makeStyles, Screen, Stack } from '@/design-system';
import { selectAiAvailability } from '@/features/capabilities';
import { describeError } from '@/lib/errors';
import type { MessageId } from '@/lib/ids';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { describeEmailSourceError } from '../emailSource';
import { useAutoTriage, type AutoTriage } from '../hooks/useAutoTriage';
import { useGmailSync } from '../hooks/useGmailSync';
import type { InboxMessage } from '../schema';
import {
  selectCanTriage,
  selectEmailSource,
  selectHasMoreFixtures,
  selectInboxMessages,
  selectTriage,
  selectTriageCandidates,
} from '../selectors';
import { nextFixtureReceived } from '../slice';
import { startTriage } from '../thunks';
import { MessageRow } from './MessageRow';

export interface InboxScreenProps {
  onOpenMessage: (id: MessageId) => void;
  onOpenGmailSettings: () => void;
}

const useStyles = makeStyles((t) => ({
  // Extra bottom room so the last card clears the floating tab bar.
  list: { gap: t.space[3], paddingBottom: t.space[12] * 2 },
}));

/** Inbox tab: messages newest first with their Triage status (INBX-1). */
export function InboxScreen({ onOpenMessage, onOpenGmailSettings }: InboxScreenProps) {
  const styles = useStyles();
  const messages = useAppSelector(selectInboxMessages);
  const source = useAppSelector(selectEmailSource);
  const autoTriage = useAutoTriage();

  return (
    <Screen header="sign" title="Inbox" eyebrow={source === 'gmail' ? 'GMAIL' : 'SAMPLE EMAILS'}>
      <FlatList
        data={messages}
        keyExtractor={(message) => message.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <InboxHeader autoTriage={autoTriage} onOpenGmailSettings={onOpenGmailSettings} />
        }
        renderItem={({ item }) => <InboxRow message={item} onOpen={() => onOpenMessage(item.id)} />}
        ListEmptyComponent={
          <EmptyState
            icon="mail-outline"
            title="No messages yet"
            body={
              source === 'gmail'
                ? 'No recent job-search email in your Gmail primary inbox.'
                : 'Sample messages appear here as they arrive.'
            }
          />
        }
      />
    </Screen>
  );
}

function InboxRow({ message, onOpen }: { message: InboxMessage; onOpen: () => void }) {
  const dispatch = useAppDispatch();
  const triage = useAppSelector((state) => selectTriage(state, message.id));
  const canTriage = useAppSelector((state) => selectCanTriage(state, message.id));
  const candidates = useAppSelector(selectTriageCandidates);
  const matchedId = triage?.status === 'done' ? triage.result.applicationId : null;
  return (
    <MessageRow
      message={message}
      triage={triage}
      matched={candidates.find((candidate) => candidate.id === matchedId)}
      canTriage={canTriage}
      onOpen={onOpen}
      onRetry={() => void dispatch(startTriage(message.id))}
    />
  );
}

function InboxHeader({
  autoTriage,
  onOpenGmailSettings,
}: {
  autoTriage: AutoTriage;
  onOpenGmailSettings: () => void;
}) {
  const dispatch = useAppDispatch();
  const availability = useAppSelector(selectAiAvailability);
  const source = useAppSelector(selectEmailSource);
  const hasMoreFixtures = useAppSelector(selectHasMoreFixtures);

  return (
    <Stack gap={3}>
      {availability?.status === 'unavailable' ? (
        <Banner
          tone="info"
          title="Tag messages manually"
          body={describeError({ kind: 'ai_unavailable', reason: availability.reason }).body}
        />
      ) : null}
      {autoTriage.paused && autoTriage.waiting > 0 ? (
        <Banner
          tone="warning"
          title="Analysis paused"
          body={`A message took too long to analyze, so ${autoTriage.waiting === 1 ? '1 message is' : `${autoTriage.waiting} messages are`} waiting.`}
          action={{ label: 'Analyze remaining', onPress: autoTriage.resume }}
        />
      ) : null}
      {source === 'gmail' ? <GmailSyncControls onReconnect={onOpenGmailSettings} /> : null}
      <Stack direction="row" gap={2} align="center" wrap="wrap">
        {__DEV__ && source === 'mock' ? (
          <Button
            label={hasMoreFixtures ? 'Receive next email' : 'No more sample emails'}
            icon="mail-unread-outline"
            variant="primary"
            disabled={!hasMoreFixtures}
            onPress={() => dispatch(nextFixtureReceived({ now: new Date().toISOString() }))}
          />
        ) : null}
        <Button
          label={source === 'gmail' ? 'Gmail settings' : 'Connect Gmail'}
          icon="logo-google"
          variant="secondary"
          onPress={onOpenGmailSettings}
        />
      </Stack>
    </Stack>
  );
}

function GmailSyncControls({ onReconnect }: { onReconnect: () => void }) {
  const { accessToken, state, sync } = useGmailSync();
  if (accessToken === null) {
    return (
      <Banner
        tone="warning"
        title="Gmail isn’t connected"
        body="Sign in again to read new messages. The sign-in isn’t saved between launches."
        action={{ label: 'Connect', onPress: onReconnect }}
      />
    );
  }
  const copy = state.status === 'failed' ? describeEmailSourceError(state.error) : undefined;
  return (
    <Stack gap={2}>
      <Button
        label="Check for new email"
        icon="refresh"
        variant="primary"
        loading={state.status === 'syncing'}
        onPress={() => void sync()}
      />
      {copy !== undefined ? (
        <Banner
          tone="danger"
          title={copy.title}
          body={copy.body}
          {...(copy.retryable ? { action: { label: 'Retry', onPress: () => void sync() } } : {})}
        />
      ) : null}
    </Stack>
  );
}
