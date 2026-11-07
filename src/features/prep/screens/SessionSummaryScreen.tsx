import { router, useLocalSearchParams } from 'expo-router';

import { Button, Card, EmptyState, Screen, Stack, Text } from '@/design-system';
import { SessionIdSchema } from '@/lib/ids';
import { useAppSelector } from '@/store/hooks';

import { FeedbackList } from '../components/FeedbackList';
import { SectionHeader } from '../components/SectionHeader';
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
  const emptyText = summary.answered === 0 ? noFeedback : 'None noted.';
  return (
    <Screen title={TITLE} onBack={router.back} scroll>
      <Stack gap={1}>
        <Text variant="board" color="secondary">
          {formatSessionDate(session.startedAt)}
        </Text>
        <Text variant="departure">
          {`${summary.answered} of ${session.turns.length} questions answered`}
        </Text>
      </Stack>
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
        <Stack gap={4}>
          <FeedbackList kind="strengths" items={summary.strengths} emptyText={emptyText} />
          <FeedbackList kind="gaps" items={summary.gaps} emptyText={emptyText} />
        </Stack>
      </Card>
      <Stack gap={6}>
        <SectionHeader label="Transcript" />
        {session.turns.map((turn, index) => (
          // Turns are append-only, so the index is a stable key.
          <TranscriptTurn key={index} turn={turn} index={index} variant="closed" />
        ))}
      </Stack>
    </Screen>
  );
}
