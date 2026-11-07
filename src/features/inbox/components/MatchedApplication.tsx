import { LineRoundel, Stack, Text } from '@/design-system';
import { lineFor } from '@/lib/lines';

import type { TriageCandidate } from '../schema';

export interface MatchedApplicationProps {
  application: TriageCandidate;
  /** Lead-in before the application, e.g. "For" or "Best guess". */
  prefix: string;
  size?: 'sm' | 'md';
}

/** The application a message is about, on its line: roundel plus "For: Acme Health — Role". */
export function MatchedApplication({ application, prefix, size = 'sm' }: MatchedApplicationProps) {
  const line = lineFor(application.id, application.company);
  return (
    <Stack direction="row" gap={2} align="center">
      <LineRoundel line={line.index} letter={line.letter} size={size} />
      <Stack flex={1}>
        <Text variant={size === 'md' ? 'bodyStrong' : 'bodySmall'}>
          {`${prefix}: ${application.company} — ${application.role}`}
        </Text>
      </Stack>
    </Stack>
  );
}
