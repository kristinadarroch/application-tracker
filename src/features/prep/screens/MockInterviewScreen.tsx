import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import {
  Button,
  Card,
  ErrorState,
  makeStyles,
  Screen,
  Skeleton,
  Stack,
  Text,
  TextField,
} from '@/design-system';
import type { Application } from '@/features/applications/model';
import { selectAiAvailability } from '@/features/capabilities';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { AiUnavailableNotice } from '../components/AiUnavailableNotice';
import { ApplicationNotFound } from '../components/ApplicationNotFound';
import { TranscriptTurn } from '../components/TranscriptTurn';
import { useAnswerMockInterviewTurn, useRouteApplication, useStartMockInterview } from '../hooks';
import type { MockInterviewSession } from '../schema';
import { selectActiveSession } from '../selectors';
import { sessionEnded } from '../slice';

const TITLE = 'Mock interview';

const useStyles = makeStyles(() => ({
  fill: { flex: 1 },
}));

/** `/prep/[applicationId]/mock`: resumes the active session or starts one (MOCK-1–5). */
export function MockInterviewScreen() {
  const application = useRouteApplication();
  if (application === undefined) return <ApplicationNotFound title={TITLE} />;
  return <MockInterview application={application} />;
}

function MockInterview({ application }: { application: Application }) {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => selectActiveSession(state, application.id));

  const end = (active: MockInterviewSession) => {
    dispatch(sessionEnded({ sessionId: active.id, now: new Date().toISOString() }));
    router.replace({
      pathname: '/prep/[applicationId]/session/[sessionId]',
      params: { applicationId: application.id, sessionId: active.id },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      {...(Platform.OS === 'ios' ? { behavior: 'padding' as const } : {})}
    >
      <Screen
        title={TITLE}
        onBack={router.back}
        scroll
        headerRight={
          session === undefined ? undefined : (
            <Button label="End" variant="ghost" onPress={() => end(session)} />
          )
        }
      >
        <Text color="secondary">{`${application.role} · ${application.company}`}</Text>
        {session === undefined ? (
          <StartSession application={application} />
        ) : (
          <ActiveSession application={application} session={session} />
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function StartSession({ application }: { application: Application }) {
  const ai = useAppSelector(selectAiAvailability);
  const start = useStartMockInterview(application);
  // Availability is checked synchronously at launch, so this placeholder only shows for a moment.
  if (ai === null) return <Skeleton width="100%" height={160} radius="lg" />;
  if (ai.status === 'unavailable')
    return <AiUnavailableNotice reason={ai.reason} variant="empty" />;
  if (start.error !== undefined && !start.pending) {
    return <ErrorState error={start.error} onRetry={start.run} />;
  }
  return (
    <Card>
      <Text variant="heading">Practice for this interview</Text>
      <Text color="secondary">
        {`Answer questions for ${application.role} at ${application.company} and get feedback after each answer. You can leave and come back anytime.`}
      </Text>
      <Button
        label="Start mock interview"
        icon="play"
        loading={start.pending}
        onPress={start.run}
      />
    </Card>
  );
}

function ActiveSession({
  application,
  session,
}: {
  application: Application;
  session: MockInterviewSession;
}) {
  const ai = useAppSelector(selectAiAvailability);
  return (
    <Stack gap={4}>
      {session.turns.map((turn, index) => (
        <TranscriptTurn
          // Turns are append-only, so the index is a stable key.
          key={index}
          turn={turn}
          index={index}
          variant={turn.feedback === undefined ? 'open' : 'closed'}
        />
      ))}
      {ai?.status === 'unavailable' ? (
        <AiUnavailableNotice reason={ai.reason} variant="banner" />
      ) : (
        // Remounts for each new question, so the field clears only after a successful turn.
        <AnswerComposer key={session.turns.length} application={application} session={session} />
      )}
    </Stack>
  );
}

function AnswerComposer({
  application,
  session,
}: {
  application: Application;
  session: MockInterviewSession;
}) {
  const turn = useAnswerMockInterviewTurn(application, session);
  // MOCK-3/MOCK-4: an answer submitted earlier (and not yet reviewed) comes back into the field.
  const [answer, setAnswer] = useState(() => session.turns.at(-1)?.answer ?? '');
  const trimmed = answer.trim();
  const submit = () => turn.run(trimmed);
  return (
    <Stack gap={3}>
      <TextField label="Your answer" value={answer} onChangeText={setAnswer} multiline />
      {turn.error !== undefined && !turn.pending ? (
        <ErrorState error={turn.error} onRetry={submit} />
      ) : null}
      <Button
        label="Submit answer"
        icon="send"
        loading={turn.pending}
        disabled={trimmed.length === 0}
        onPress={submit}
      />
    </Stack>
  );
}
