import { SpotlightCard } from '@/design-system';
import { accentFor } from '@/lib/accents';
import type { ApplicationId } from '@/lib/ids';

import { prepProgressText } from '../prepProgress';
import type { NextInterview } from '../selectors';

export interface NextInterviewCardProps {
  /** The Interviewing application to prep for first; undefined when none is Interviewing. */
  next: NextInterview | undefined;
  onPractice: (applicationId: ApplicationId) => void;
  onMock: (applicationId: ApplicationId) => void;
}

/** Leads the home screen: prep progress for the next interview, with shortcuts into prep. */
export function NextInterviewCard({ next, onPractice, onMock }: NextInterviewCardProps) {
  if (next === undefined) {
    return (
      <SpotlightCard
        eyebrow="Interview prep"
        title="No interviews yet"
        subtitle="Move an application to Interviewing and its prep questions show up here."
      />
    );
  }
  const { application, otherCount } = next;
  return (
    <SpotlightCard
      eyebrow="Next interview"
      {...(otherCount > 0 ? { count: `+${otherCount} more` } : {})}
      accent={accentFor(application.id, application.company)}
      title={application.company}
      subtitle={application.role}
      body={prepProgressText(next)}
      action={{ label: 'Practice questions', onPress: () => onPractice(application.id) }}
      secondaryAction={{ label: 'Mock interview', onPress: () => onMock(application.id) }}
    />
  );
}
