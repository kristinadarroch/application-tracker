import { View } from 'react-native';

import { Card, makeStyles, ProposalCard, Stack, Text } from '@/design-system';

import type { MockInterviewTurn } from '../schema';
import { FeedbackList } from './FeedbackList';

export interface TranscriptTurnProps {
  turn: MockInterviewTurn;
  index: number;
  /** `open` hides the answer: it is still being edited in the answer field. */
  variant: 'closed' | 'open';
}

const useStyles = makeStyles((t) => ({
  board: {
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.md,
    padding: t.space[4],
    gap: t.space[1],
  },
}));

/** One stop of the practice loop: the question, the user's answer, and its Answer Feedback (MOCK-2). */
export function TranscriptTurn({ turn, index, variant }: TranscriptTurnProps) {
  const styles = useStyles();
  return (
    <Stack gap={3}>
      <Stack gap={1}>
        <Text variant="station" color="secondary">{`Stop ${index + 1}`}</Text>
        <Text variant="departure">{turn.question}</Text>
      </Stack>
      {variant === 'closed' ? (
        <Card>
          <Stack gap={1}>
            <Text variant="station" color="secondary">
              Your answer
            </Text>
            <Text color={turn.answer === undefined ? 'secondary' : 'primary'}>
              {turn.answer ?? 'Not answered'}
            </Text>
          </Stack>
        </Card>
      ) : null}
      {turn.feedback !== undefined ? (
        <ProposalCard eyebrow="PROPOSED FEEDBACK" onDevice>
          <Stack gap={3}>
            <FeedbackList
              kind="strengths"
              items={turn.feedback.strengths}
              emptyText="None noted."
            />
            <FeedbackList kind="gaps" items={turn.feedback.gaps} emptyText="None noted." />
            <View style={styles.board}>
              <Text variant="station">Stronger answer</Text>
              <Text>{turn.feedback.strongerAnswer}</Text>
            </View>
          </Stack>
        </ProposalCard>
      ) : null}
    </Stack>
  );
}
