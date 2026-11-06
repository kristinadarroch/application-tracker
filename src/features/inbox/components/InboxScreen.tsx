import { FlatList } from 'react-native';

import { Badge, Banner, Button, EmptyState, makeStyles, Screen, Stack } from '@/design-system';
import { selectAiAvailability } from '@/features/capabilities/slice';
import { describeError } from '@/lib/errors';
import type { MessageId } from '@/lib/ids';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { describeEmailSourceError } from '../emailSource';
import { useAutoTriage } from '../hooks/useAutoTriage';
import { useGmailSync } from '../hooks/useGmailSync';
import type { InboxMessage } from '../schema';
import {
  selectCanTriage,
  selectEmailSource,
  selectHasMoreFixtures,
  selectInboxMessages,
  selectTriage,
} from '../selectors';
import { nextFixtureReceived } from '../slice';
import { startTriage } from '../thunks';
import { MessageRow } from './MessageRow';

export interface InboxScreenProps {
  onOpenMessage: (id: MessageId) => void;
  onOpenGmailSettings: () => void;
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.space[3], paddingBottom: t.space[6] },
}));

/** Inbox tab: messages newest first with their Triage status (INBX-1). */
export function InboxScreen({ onOpenMessage, onOpenGmailSettings }: InboxScreenProps) {
  const styles = useStyles();
  const messages = useAppSelector(selectInboxMessages);
  const source = useAppSelector(selectEmailSource);
  useAutoTriage();

  return (
    <Screen
      title="Inbox"
      headerRight={<Badge tone="neutral" label={source === 'gmail' ? 'Gmail' : 'Sample emails'} />}
    >
      <FlatList
        data={messages}
        keyExtractor={(message) => message.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<InboxHeader onOpenGmailSettings={onOpenGmailSettings} />}
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
  return (
    <MessageRow
      message={message}
      triage={triage}
      canTriage={canTriage}
      onOpen={onOpen}
      onRetry={() => void dispatch(startTriage(message.id))}
    />
  );
}

function InboxHeader({ onOpenGmailSettings }: { onOpenGmailSettings: () => void }) {
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
      {source === 'gmail' ? <GmailSyncControls onReconnect={onOpenGmailSettings} /> : null}
      {__DEV__ && source === 'mock' ? (
        <Button
          label={hasMoreFixtures ? 'Receive next email' : 'No more sample emails'}
          icon="mail-unread-outline"
          variant="secondary"
          disabled={!hasMoreFixtures}
          onPress={() => dispatch(nextFixtureReceived({ now: new Date().toISOString() }))}
        />
      ) : null}
      <Button
        label={source === 'gmail' ? 'Gmail settings' : 'Connect Gmail'}
        icon="logo-google"
        variant="ghost"
        onPress={onOpenGmailSettings}
      />
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
        variant="secondary"
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
