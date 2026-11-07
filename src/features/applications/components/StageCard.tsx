import { Card, StageStep, Stack, Text } from '@/design-system';
import type { CompanyAccent } from '@/lib/accents';
import { STAGE_LABELS, type Stage } from '@/lib/stage';

import { formatShortDate } from '../shortDate';
import type { Application } from '../schema';
import { NextStepRow } from './NextStepRow';

export interface StageCardProps {
  application: Application;
  accent: CompanyAccent;
  now: Date;
  onStageChange: (stage: Stage) => void;
}

/** The four stages every application moves through; Rejected and Withdrawn close it early. */
const OPEN_STAGES = [
  'saved',
  'applied',
  'interviewing',
  'offer',
] as const satisfies readonly Stage[];

const CLOSED_TAG: Record<'rejected' | 'withdrawn', string> = {
  rejected: 'Closed: rejected',
  withdrawn: 'Closed: withdrawn',
};

/**
 * The application's stages as a vertical progress list. Each stage is a button that moves
 * the application there (PIPE-3); open Next Steps sit under the current stage as panels,
 * soonest first (PIPE-6).
 */
export function StageCard({ application, accent, now, onStageChange }: StageCardProps) {
  const { id, stage, createdAt } = application;
  const closedTag = stage === 'rejected' || stage === 'withdrawn' ? CLOSED_TAG[stage] : undefined;
  const closed = closedTag !== undefined;
  const currentIndex = OPEN_STAGES.findIndex((step) => step === stage);
  const open = application.nextSteps
    .filter((step) => !step.done)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const openSteps = (
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
      {OPEN_STAGES.map((step, index) => {
        const state =
          closed || index > currentIndex ? 'future' : index < currentIndex ? 'passed' : 'current';
        const meta =
          step === 'saved' && state === 'passed'
            ? formatShortDate(new Date(createdAt))
            : !closed && index === currentIndex + 1
              ? 'Next stage'
              : undefined;
        return (
          <StageStep
            key={step}
            stage={step}
            state={state}
            accent={accent.index}
            label={STAGE_LABELS[step]}
            {...(meta === undefined ? {} : { meta })}
            {...(state === 'current' ? { tag: 'Current' } : {})}
            selected={state === 'current'}
            onPress={() => {
              if (step !== stage) onStageChange(step);
            }}
            last={!closed && index === OPEN_STAGES.length - 1}
          >
            {state === 'current' ? openSteps : null}
          </StageStep>
        );
      })}
      {closedTag !== undefined ? (
        <StageStep
          stage={stage}
          state="current"
          accent={accent.index}
          label={STAGE_LABELS[stage]}
          tag={closedTag}
          last
        >
          {openSteps}
        </StageStep>
      ) : null}
    </Card>
  );
}
