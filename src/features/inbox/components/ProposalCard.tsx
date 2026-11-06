import { useState, type ReactNode } from 'react';

import { Badge, Banner, Button, Card, Stack, Text } from '@/design-system';
import { formatDueDate } from '@/lib/dates';
import type { ApplicationId } from '@/lib/ids';

import type { ProposalDecision, TriageCandidate, TriageResult } from '../schema';
import { ApplicationPicker } from './ApplicationPicker';
import { CATEGORY_LABELS, CATEGORY_TONES, REPLAYED_LABEL } from './triageCopy';

export interface ProposalCardProps {
  result: TriageResult;
  replayed: boolean;
  decision: ProposalDecision;
  applications: readonly TriageCandidate[];
  onAccept: (applicationId: ApplicationId) => void;
  onDismiss: () => void;
}

/** A finished Triage: category, matched application, and the proposed Next Step (INBX-2–4). */
export function ProposalCard({
  result,
  replayed,
  decision,
  applications,
  onAccept,
  onDismiss,
}: ProposalCardProps) {
  const matched = applications.find((a) => a.id === result.applicationId);
  // Uncertain or missing matches are never accepted silently: the user picks (INBX-4).
  const mustChoose = result.confidence === 'low' || matched === undefined;
  const [chosenId, setChosenId] = useState<ApplicationId | null>(null);
  const targetId = mustChoose ? chosenId : (matched?.id ?? null);
  const target = applications.find((a) => a.id === targetId);
  const step = result.proposedNextStep;

  return (
    <Card>
      <Stack gap={3}>
        <Stack direction="row" gap={2} wrap="wrap">
          <Badge tone={CATEGORY_TONES[result.category]} label={CATEGORY_LABELS[result.category]} />
          {replayed ? <Badge tone="warning" label={REPLAYED_LABEL} /> : null}
          {result.confidence === 'low' ? <Badge tone="neutral" label="Unsure match" /> : null}
        </Stack>
        {result.category === 'unrelated' ? (
          <Text color="secondary">Not about your applications. Nothing to do.</Text>
        ) : (
          <>
            <Text color="secondary">
              {matched === undefined
                ? 'Not matched to any of your applications.'
                : `${mustChoose ? 'Best guess' : 'For'}: ${matched.company} — ${matched.role}`}
            </Text>
            {step === undefined ? (
              <Text color="secondary">No Next Step proposed.</Text>
            ) : (
              <ProposedStep
                title={step.title}
                due={formatDueDate(step.dueDate, new Date())}
                decision={decision}
                targetCompany={target?.company}
              >
                {mustChoose ? (
                  <ApplicationPicker
                    label="Which application is this about?"
                    applications={applications}
                    selectedId={chosenId}
                    onSelect={setChosenId}
                  />
                ) : null}
                <Stack direction="row" gap={2} wrap="wrap">
                  <Button
                    label="Accept"
                    icon="checkmark"
                    disabled={targetId === null}
                    {...(targetId === null
                      ? { accessibilityHint: 'Choose an application first' }
                      : {})}
                    onPress={() => {
                      if (targetId !== null) onAccept(targetId);
                    }}
                  />
                  <Button label="Dismiss" variant="secondary" onPress={onDismiss} />
                </Stack>
              </ProposedStep>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
}

function ProposedStep({
  title,
  due,
  decision,
  targetCompany,
  children,
}: {
  title: string;
  due: string;
  decision: ProposalDecision;
  targetCompany: string | undefined;
  children: ReactNode;
}) {
  return (
    <Stack gap={3}>
      <Stack gap={1}>
        <Text variant="heading">Proposed Next Step</Text>
        <Text variant="bodyStrong">{title}</Text>
        <Text color="secondary">{`Due: ${due}`}</Text>
      </Stack>
      {decision === 'accepted' ? (
        <Banner
          tone="success"
          title={`Next Step added${targetCompany === undefined ? '' : ` to ${targetCompany}`}`}
        />
      ) : decision === 'dismissed' ? (
        <Text color="secondary">Dismissed. Nothing was changed.</Text>
      ) : (
        children
      )}
    </Stack>
  );
}
