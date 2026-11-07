import { useState } from 'react';
import { View } from 'react-native';

import { Card, StageProgressLegend, makeStyles, Text } from '@/design-system';
import type { ApplicationId } from '@/lib/ids';
import { STAGES, type Stage } from '@/lib/stage';

import { dueLabel } from '../nextStepDue';
import type { Application, NextStep } from '../schema';
import { NO_PREP, type PrepSummary } from '../selectors';
import { ApplicationRow } from './ApplicationRow';
import { StageHeader } from './StageHeader';
import { StatusFilter, type StatusFilterValue } from './StatusFilter';

export interface ApplicationsCardProps {
  byStage: Record<Stage, Application[]>;
  urgentSteps: ReadonlyMap<ApplicationId, NextStep>;
  prepByApplication: ReadonlyMap<ApplicationId, PrepSummary>;
  now: Date;
  onOpen: (applicationId: ApplicationId) => void;
}

const useStyles = makeStyles((t) => ({
  title: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: t.space[2],
  },
  /** Aligns the captions with the progress strips, which start after a `md` badge and the row gap. */
  legend: { paddingLeft: t.space[8] + t.space[3] },
}));

/**
 * Every application, grouped by stage in pipeline order. Every stage shows with its
 * count, and empty stages collapse to one compact row (PIPE-1). The status filter narrows the
 * list to one stage (PIPE-8).
 */
export function ApplicationsCard({
  byStage,
  urgentSteps,
  prepByApplication,
  now,
  onOpen,
}: ApplicationsCardProps) {
  const styles = useStyles();
  const [filter, setFilter] = useState<StatusFilterValue>('all');
  const counts = Object.fromEntries(
    STAGES.map((stage) => [stage, byStage[stage].length]),
  ) as Record<Stage, number>;
  const closed = counts.rejected + counts.withdrawn;
  const active = STAGES.reduce((sum, stage) => sum + counts[stage], 0) - closed;
  const stages = filter === 'all' ? STAGES : [filter];
  return (
    <Card>
      <View style={styles.title}>
        <Text variant="heading">Your applications</Text>
        <Text variant="bodySmall" color="secondary">
          {`${active} active · ${closed} closed`}
        </Text>
      </View>
      <StatusFilter counts={counts} value={filter} onChange={setFilter} />
      <View style={styles.legend}>
        <StageProgressLegend />
      </View>
      {stages.map((stage) => (
        <View key={stage}>
          <StageHeader stage={stage} count={counts[stage]} />
          {filter !== 'all' && counts[stage] === 0 ? (
            <Text color="secondary">No applications in this status.</Text>
          ) : null}
          {byStage[stage].map((application) => {
            const urgentStep = urgentSteps.get(application.id);
            return (
              <ApplicationRow
                key={application.id}
                application={application}
                urgentLabel={
                  urgentStep === undefined ? undefined : dueLabel(urgentStep.dueDate, now)
                }
                prep={prepByApplication.get(application.id) ?? NO_PREP}
                onPress={() => onOpen(application.id)}
              />
            );
          })}
        </View>
      ))}
    </Card>
  );
}
