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
  answerPanel: {
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.md,
    padding: t.space[4],
    gap: t.space[1],
  },
}));

/** One mock interview turn: the question, the user's answer, and its Answer Feedback (MOCK-2). */
export function TranscriptTurn({ turn, index, variant }: TranscriptTurnProps) {
  const styles = useStyles();
  return (
    <Stack gap={3}>
      <Stack gap={1}>
        <Text variant="overline" color="secondary">{`Question ${index + 1}`}</Text>
        <Text variant="feature">{turn.question}</Text>
      </Stack>
      {variant === 'closed' ? (
        <Card>
          <Stack gap={1}>
            <Text variant="overline" color="secondary">
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
            <View style={styles.answerPanel}>
              <Text variant="overline">Stronger answer</Text>
              <Text>{turn.feedback.strongerAnswer}</Text>
            </View>
          </Stack>
        </ProposalCard>
      ) : null}
    </Stack>
  );
}
