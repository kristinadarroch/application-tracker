import { Card, Stack, Text } from '@/design-system';

import type { MockInterviewTurn } from '../schema';
import { BulletList } from './BulletList';

export interface TranscriptTurnProps {
  turn: MockInterviewTurn;
  index: number;
  /** `open` hides the answer: it is still being edited in the answer field. */
  variant: 'closed' | 'open';
}

/** One question, the user's answer, and its Answer Feedback (MOCK-2). */
export function TranscriptTurn({ turn, index, variant }: TranscriptTurnProps) {
  return (
    <Stack gap={2}>
      <Card>
        <Text variant="caption" color="secondary">{`Question ${index + 1}`}</Text>
        <Text variant="heading">{turn.question}</Text>
        {variant === 'closed' ? (
          <Stack gap={1}>
            <Text variant="bodyStrong">Your answer</Text>
            <Text color={turn.answer === undefined ? 'secondary' : 'primary'}>
              {turn.answer ?? 'Not answered'}
            </Text>
          </Stack>
        ) : null}
      </Card>
      {turn.feedback !== undefined ? (
        <Card elevated>
          <Text variant="heading">Feedback</Text>
          <BulletList title="Strengths" items={turn.feedback.strengths} emptyText="None noted." />
          <BulletList title="Gaps" items={turn.feedback.gaps} emptyText="None noted." />
          <Stack gap={1}>
            <Text variant="bodyStrong">Stronger answer</Text>
            <Text>{turn.feedback.strongerAnswer}</Text>
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}
