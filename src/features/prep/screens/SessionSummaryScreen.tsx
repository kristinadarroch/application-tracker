import { router, useLocalSearchParams } from 'expo-router';

import { Button, Card, EmptyState, Screen, Stack, Text } from '@/design-system';
import { SessionIdSchema } from '@/lib/ids';
import { useAppSelector } from '@/store/hooks';

import { BulletList } from '../components/BulletList';
import { TranscriptTurn } from '../components/TranscriptTurn';
import { selectSessionById } from '../selectors';
import { formatSessionDate, summarizeSession } from '../session';

const TITLE = 'Session summary';

/** `/prep/[applicationId]/session/[sessionId]`: strengths and gaps across all answers, then the transcript (MOCK-5). */
export function SessionSummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const parsed = SessionIdSchema.safeParse(sessionId);
  const session = useAppSelector((state) =>
    parsed.success ? selectSessionById(state, parsed.data) : undefined,
  );

  if (session === undefined) {
    return (
      <Screen title={TITLE} onBack={router.back}>
        <EmptyState
          icon="chatbubbles-outline"
          title="Session not found"
          body="This mock interview session no longer exists."
        />
      </Screen>
    );
  }

  const summary = summarizeSession(session);
  const noFeedback = 'Answer at least one question to get feedback.';
  return (
    <Screen title={TITLE} onBack={router.back} scroll>
      <Text color="secondary">
        {`${formatSessionDate(session.startedAt)} · ${summary.answered} of ${session.turns.length} questions answered`}
      </Text>
      {session.status === 'active' ? (
        <Button
          label="Continue mock interview"
          icon="chatbubbles-outline"
          onPress={() =>
            router.push({
              pathname: '/prep/[applicationId]/mock',
              params: { applicationId: session.applicationId },
            })
          }
        />
      ) : null}
      <Card>
        <BulletList
          title="Strengths"
          items={summary.strengths}
          emptyText={summary.answered === 0 ? noFeedback : 'None noted.'}
        />
      </Card>
      <Card>
        <BulletList
          title="Gaps"
          items={summary.gaps}
          emptyText={summary.answered === 0 ? noFeedback : 'None noted.'}
        />
      </Card>
      <Stack gap={4}>
        <Text variant="heading">Transcript</Text>
        {session.turns.map((turn, index) => (
          // Turns are append-only, so the index is a stable key.
          <TranscriptTurn key={index} turn={turn} index={index} variant="closed" />
        ))}
      </Stack>
    </Screen>
  );
}
