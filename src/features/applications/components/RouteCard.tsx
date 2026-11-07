import { Card, RouteStation, Stack, Text } from '@/design-system';
import type { LineIdentity } from '@/lib/lines';
import { STAGE_LABELS, type Stage } from '@/lib/stage';

import { formatBoardDate } from '../boardDate';
import type { Application } from '../schema';
import { NextStepRow } from './NextStepRow';

export interface RouteCardProps {
  application: Application;
  line: LineIdentity;
  now: Date;
  onStageChange: (stage: Stage) => void;
}

/** The four stations every line runs through; Rejected and Withdrawn end the route early. */
const ROUTE = ['saved', 'applied', 'interviewing', 'offer'] as const satisfies readonly Stage[];

const CLOSED_TAG: Record<'rejected' | 'withdrawn', string> = {
  rejected: 'Route complete',
  withdrawn: 'Left the line',
};

/**
 * The application's route as a vertical line of stations. Each station is a button that moves
 * the application there (PIPE-3); open Next Steps ride under the current station as departure
 * boards, soonest first (PIPE-6).
 */
export function RouteCard({ application, line, now, onStageChange }: RouteCardProps) {
  const { id, stage, createdAt } = application;
  const closedTag = stage === 'rejected' || stage === 'withdrawn' ? CLOSED_TAG[stage] : undefined;
  const closed = closedTag !== undefined;
  const currentIndex = ROUTE.findIndex((station) => station === stage);
  const open = application.nextSteps
    .filter((step) => !step.done)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const departures = (
    <Stack gap={2}>
      {open.length === 0 ? (
        <Text color="secondary">No open Next Steps.</Text>
      ) : (
        open.map((step, index) => (
          <NextStepRow
            key={step.id}
            applicationId={id}
            step={step}
            now={now}
            eyebrow={index === 0 ? 'Next step' : 'Then'}
          />
        ))
      )}
    </Stack>
  );

  return (
    <Card>
      {ROUTE.map((station, index) => {
        const state =
          closed || index > currentIndex ? 'future' : index < currentIndex ? 'passed' : 'current';
        const meta =
          station === 'saved' && state === 'passed'
            ? formatBoardDate(new Date(createdAt))
            : !closed && index === currentIndex + 1
              ? 'Next station'
              : undefined;
        return (
          <RouteStation
            key={station}
            stage={station}
            state={state}
            line={line.index}
            label={STAGE_LABELS[station]}
            {...(meta === undefined ? {} : { meta })}
            {...(state === 'current' ? { tag: 'You are here' } : {})}
            selected={state === 'current'}
            onPress={() => {
              if (station !== stage) onStageChange(station);
            }}
            last={!closed && index === ROUTE.length - 1}
          >
            {state === 'current' ? departures : null}
          </RouteStation>
        );
      })}
      {closedTag !== undefined ? (
        <RouteStation
          stage={stage}
          state="current"
          line={line.index}
          label={STAGE_LABELS[stage]}
          tag={closedTag}
          last
        >
          {departures}
        </RouteStation>
      ) : null}
    </Card>
  );
}
