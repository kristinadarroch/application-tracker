import { CompanyBadge, Stack, Text } from '@/design-system';
import { accentFor } from '@/lib/accents';

import type { TriageCandidate } from '../schema';

export interface MatchedApplicationProps {
  application: TriageCandidate;
  /** Lead-in before the application, e.g. "For" or "Best guess". */
  prefix: string;
  size?: 'sm' | 'md';
}

/** The application a message is about: company badge plus "For: Acme Health — Role". */
export function MatchedApplication({ application, prefix, size = 'sm' }: MatchedApplicationProps) {
  const accent = accentFor(application.id, application.company);
  return (
    <Stack direction="row" gap={2} align="center">
      <CompanyBadge accent={accent.index} letter={accent.letter} size={size} />
      <Stack flex={1}>
        <Text variant={size === 'md' ? 'bodyStrong' : 'bodySmall'}>
          {`${prefix}: ${application.company} — ${application.role}`}
        </Text>
      </Stack>
    </Stack>
  );
}
