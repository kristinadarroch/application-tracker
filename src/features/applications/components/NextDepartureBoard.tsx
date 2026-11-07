import { DepartureBoard } from '@/design-system';
import { addDays, toIsoDate } from '@/lib/dates';
import type { ApplicationId } from '@/lib/ids';
import { lineFor } from '@/lib/lines';

import { dueLabel } from '../nextStepDue';
import type { UpcomingNextStep } from '../selectors';

export interface NextDepartureBoardProps {
  /** Open Next Steps across all applications, soonest first. */
  upcoming: readonly UpcomingNextStep[];
  now: Date;
  onOpen: (applicationId: ApplicationId) => void;
}

/** "1 TODAY · 2 TOMORROW": how many open Next Steps leave in the next two days. */
function departureCount(upcoming: readonly UpcomingNextStep[], now: Date): string | undefined {
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

/** The soonest open Next Step across every line, as a departure board (PIPE-6). */
export function NextDepartureBoard({ upcoming, now, onOpen }: NextDepartureBoardProps) {
  const next = upcoming[0];
  if (next === undefined) {
    return (
      <DepartureBoard
        eyebrow="Next departure"
        title="Nothing scheduled"
        subtitle="Add a Next Step from any application."
      />
    );
  }
  const count = departureCount(upcoming, now);
  return (
    <DepartureBoard
      eyebrow="Next departure"
      {...(count === undefined ? {} : { count })}
      line={lineFor(next.applicationId, next.company)}
      title={next.step.title}
      subtitle={`${next.company} · ${next.role}`}
      {...(next.urgent ? { urgentLabel: dueLabel(next.step.dueDate, now) } : {})}
      action={{ label: 'Board', onPress: () => onOpen(next.applicationId) }}
    />
  );
}
