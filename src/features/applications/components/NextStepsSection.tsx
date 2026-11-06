import { Card, Text } from '@/design-system';

import type { Application } from '../schema';
import { AddNextStepForm } from './AddNextStepForm';
import { NextStepRow } from './NextStepRow';

export interface NextStepsSectionProps {
  application: Application;
  now: Date;
}

/** Open Next Steps soonest first, then completed ones most recent first, then the add form (PIPE-6). */
export function NextStepsSection({ application, now }: NextStepsSectionProps) {
  const open = application.nextSteps
    .filter((step) => !step.done)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const completed = application.nextSteps
    .filter((step) => step.done)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  return (
    <Card>
      <Text variant="heading">Next Steps</Text>
      {open.length === 0 ? (
        <Text color="secondary">No open Next Steps.</Text>
      ) : (
        open.map((step) => (
          <NextStepRow key={step.id} applicationId={application.id} step={step} now={now} />
        ))
      )}
      {completed.length > 0 ? (
        <>
          <Text variant="heading">Completed</Text>
          {completed.map((step) => (
            <NextStepRow key={step.id} applicationId={application.id} step={step} now={now} />
          ))}
        </>
      ) : null}
      <Text variant="heading">Add a Next Step</Text>
      <AddNextStepForm applicationId={application.id} now={now} />
    </Card>
  );
}
