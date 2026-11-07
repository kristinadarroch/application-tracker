import { View } from 'react-native';

import { Card, LineStripLegend, makeStyles, Text } from '@/design-system';
import type { ApplicationId } from '@/lib/ids';
import { STAGES, type Stage } from '@/lib/stage';

import { dueLabel } from '../nextStepDue';
import type { Application, NextStep } from '../schema';
import { LineRow } from './LineRow';
import { StageHeader } from './StageHeader';

export interface YourLinesCardProps {
  byStage: Record<Stage, Application[]>;
  urgentSteps: ReadonlyMap<ApplicationId, NextStep>;
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
  /** Lines the captions up with the strips, which start after a `md` roundel and the row gap. */
  legend: { paddingLeft: t.space[8] + t.space[3] },
}));

/**
 * Every application as a line, grouped by station in pipeline order. Every stage shows with its
 * count, and empty stages collapse to one compact row (PIPE-1).
 */
export function YourLinesCard({ byStage, urgentSteps, now, onOpen }: YourLinesCardProps) {
  const styles = useStyles();
  const complete = byStage.rejected.length + byStage.withdrawn.length;
  const running = STAGES.reduce((sum, stage) => sum + byStage[stage].length, 0) - complete;
  return (
    <Card>
      <View style={styles.title}>
        <Text variant="heading">Your lines</Text>
        <Text variant="bodySmall" color="secondary">
          {`${running} running · ${complete} complete`}
        </Text>
      </View>
      <View style={styles.legend}>
        <LineStripLegend />
      </View>
      {STAGES.map((stage) => (
        <View key={stage}>
          <StageHeader stage={stage} count={byStage[stage].length} />
          {byStage[stage].map((application) => {
            const urgentStep = urgentSteps.get(application.id);
            return (
              <LineRow
                key={application.id}
                application={application}
                urgentLabel={
                  urgentStep === undefined ? undefined : dueLabel(urgentStep.dueDate, now)
                }
                onPress={() => onOpen(application.id)}
              />
            );
          })}
        </View>
      ))}
    </Card>
  );
}
