import { SpotlightCard } from '@/design-system';
import { accentFor } from '@/lib/accents';
import { addDays, toIsoDate } from '@/lib/dates';
import type { ApplicationId } from '@/lib/ids';

import { dueLabel } from '../nextStepDue';
import type { UpcomingNextStep } from '../selectors';

export interface UpNextCardProps {
  /** Open Next Steps across all applications, soonest first. */
  upcoming: readonly UpcomingNextStep[];
  now: Date;
  onOpen: (applicationId: ApplicationId) => void;
}

/** "1 TODAY · 2 TOMORROW": how many open Next Steps are due in the next two days. */
function dueSoonCount(upcoming: readonly UpcomingNextStep[], now: Date): string | undefined {
  const today = toIsoDate(now);
  const tomorrow = toIsoDate(addDays(now, 1));
  const dueToday = upcoming.filter(({ step }) => step.dueDate === today).length;
  const dueTomorrow = upcoming.filter(({ step }) => step.dueDate === tomorrow).length;
  const parts = [
    dueToday > 0 ? `${dueToday} today` : undefined,
    dueTomorrow > 0 ? `${dueTomorrow} tomorrow` : undefined,
  ].filter((part) => part !== undefined);
  return parts.length === 0 ? undefined : parts.join(' · ');
}

/** The soonest open Next Step across every application, as a spotlight card (PIPE-6). */
export function UpNextCard({ upcoming, now, onOpen }: UpNextCardProps) {
  const next = upcoming[0];
  if (next === undefined) {
    return (
      <SpotlightCard
        eyebrow="Up next"
        title="Nothing scheduled"
        subtitle="Add a Next Step from any application."
      />
    );
  }
  const count = dueSoonCount(upcoming, now);
  return (
    <SpotlightCard
      eyebrow="Up next"
      {...(count === undefined ? {} : { count })}
      accent={accentFor(next.applicationId, next.company)}
      title={next.step.title}
      subtitle={`${next.company} · ${next.role}`}
      {...(next.urgent ? { urgentLabel: dueLabel(next.step.dueDate, now) } : {})}
      action={{ label: 'View', onPress: () => onOpen(next.applicationId) }}
    />
  );
}
