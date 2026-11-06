import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useEffectEvent } from 'react';

import { Badge, Banner, Button, Card, Screen, Stack, Text } from '@/design-system';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { describeEmailSourceError } from '../emailSource';
import { GMAIL_READONLY_SCOPE, platformClientId, setGmailAccessToken } from '../gmail/gmailSession';
import { useGmailSync, type GmailSync } from '../hooks/useGmailSync';
import { selectEmailSource } from '../selectors';
import { emailSourceChanged } from '../slice';

export interface ConnectGmailScreenProps {
  onBack: () => void;
  /** The OAuth client id for this platform; `undefined` shows the setup steps instead. */
  clientId?: string | undefined;
}

const SETUP_STEPS = [
  'In Google Cloud console, enable the Gmail API and set up the OAuth consent screen with yourself as a test user.',
  'Create OAuth client ids for iOS and Android using this app’s bundle id and package name.',
  'Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in .env, then rebuild the dev client.',
];

/** Connect a real Gmail inbox, read-only (LATER-2). Without client ids the inbox stays on sample email. */
export function ConnectGmailScreen({
  onBack,
  clientId = platformClientId,
}: ConnectGmailScreenProps) {
  const source = useAppSelector(selectEmailSource);
  const gmail = useGmailSync();
  const dispatch = useAppDispatch();
  const connected = source === 'gmail' && gmail.accessToken !== null;

  return (
    <Screen title="Gmail" onBack={onBack} scroll>
      <Stack gap={4}>
        <Stack direction="row" gap={2} align="center">
          <Text variant="bodyStrong">Email Source</Text>
          <Badge
            tone={connected ? 'success' : 'neutral'}
            label={
              connected
                ? 'Gmail · connected'
                : source === 'gmail'
                  ? 'Gmail · signed out'
                  : 'Sample emails'
            }
          />
        </Stack>
        <Text color="secondary">
          The app reads your primary inbox from the last 30 days with read-only access. Messages are
          analyzed on this device. The sign-in is kept in memory only, so you connect again after
          restarting the app.
        </Text>
        {clientId === undefined ? (
          <SetupNeeded />
        ) : connected ? (
          <Connected gmail={gmail} />
        ) : (
          <SignIn
            clientId={clientId}
            onSignedIn={(token) => {
              setGmailAccessToken(token);
              dispatch(emailSourceChanged('gmail'));
              void gmail.sync(token);
            }}
          />
        )}
        {source === 'gmail' ? (
          <Button
            label="Disconnect"
            variant="destructive"
            onPress={() => {
              setGmailAccessToken(null);
              dispatch(emailSourceChanged('mock'));
            }}
            accessibilityHint="Removes Gmail messages and goes back to sample email"
          />
        ) : null}
      </Stack>
    </Screen>
  );
}

function SetupNeeded() {
  return (
    <Card>
      <Stack gap={3}>
        <Text variant="heading">Gmail isn’t set up in this build</Text>
        {SETUP_STEPS.map((step, index) => (
          <Text key={step}>{`${index + 1}. ${step}`}</Text>
        ))}
        <Button
          label="Connect Gmail"
          icon="logo-google"
          disabled
          accessibilityHint="Unavailable until the Google OAuth client ids are configured"
          onPress={() => undefined}
        />
        <Text color="secondary">Until then, the inbox uses sample emails.</Text>
      </Stack>
    </Card>
  );
}

function SignIn({
  clientId,
  onSignedIn,
}: {
  clientId: string;
  onSignedIn: (token: string) => void;
}) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: clientId,
    androidClientId: clientId,
    scopes: [GMAIL_READONLY_SCOPE],
  });
  const token = response?.type === 'success' ? response.authentication?.accessToken : undefined;

  // Only a new token triggers sign-in; the latest callback is read when it does.
  const signedIn = useEffectEvent((accessToken: string) => onSignedIn(accessToken));
  useEffect(() => {
    if (token !== undefined) signedIn(token);
  }, [token]);

  return (
    <Stack gap={2}>
      {response?.type === 'error' ? (
        <Banner
          tone="danger"
          title="Couldn’t sign in to Google"
          body={response.error?.message ?? 'Try again.'}
        />
      ) : null}
      <Button
        label="Connect Gmail"
        icon="logo-google"
        loading={request === null}
        onPress={() => void promptAsync()}
      />
    </Stack>
  );
}

function Connected({ gmail }: { gmail: GmailSync }) {
  const { state, sync } = gmail;
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
      {state.status === 'synced' ? (
        <Text color="secondary">
          {state.added === 1 ? '1 new message' : `${state.added} new messages`}
        </Text>
      ) : null}
      {copy !== undefined ? <Banner tone="danger" title={copy.title} body={copy.body} /> : null}
    </Stack>
  );
}
