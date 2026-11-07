import { useState, type ReactNode } from 'react';

import { Badge, Banner, Button, Card, ProposalCard, Stack, Text } from '@/design-system';
import { formatDueDate } from '@/lib/dates';
import type { ApplicationId } from '@/lib/ids';

import type { ProposalDecision, TriageCandidate, TriageResult } from '../schema';
import { ApplicationPicker } from './ApplicationPicker';
import { MatchedApplication } from './MatchedApplication';
import { CATEGORY_LABELS, CATEGORY_TONES, REPLAYED_LABEL } from './triageCopy';

export interface TriageResultPanelProps {
  result: TriageResult;
  replayed: boolean;
  decision: ProposalDecision;
  applications: readonly TriageCandidate[];
  onAccept: (applicationId: ApplicationId) => void;
  onDismiss: () => void;
}

/**
 * A finished Triage: category and matched application, then the proposed Next Step as track
 * under construction until the user accepts or dismisses it (INBX-2–4).
 */
export function TriageResultPanel({
  result,
  replayed,
  decision,
  applications,
  onAccept,
  onDismiss,
}: TriageResultPanelProps) {
  const matched = applications.find((a) => a.id === result.applicationId);
  // Uncertain or missing matches are never accepted silently: the user picks (INBX-4).
  const mustChoose = result.confidence === 'low' || matched === undefined;
  const [chosenId, setChosenId] = useState<ApplicationId | null>(null);
  const targetId = mustChoose ? chosenId : (matched?.id ?? null);
  const target = applications.find((a) => a.id === targetId);
  const step = result.proposedNextStep;
  const related = result.category !== 'unrelated';

  return (
    <Stack gap={3}>
      <Card variant="surface">
        <Stack gap={3}>
          <Stack direction="row" gap={2} wrap="wrap">
            <Badge
              tone={CATEGORY_TONES[result.category]}
              label={CATEGORY_LABELS[result.category]}
            />
            {replayed ? <Badge tone="warning" label={REPLAYED_LABEL} /> : null}
            {related && result.confidence === 'low' ? (
              <Badge tone="neutral" icon="help-circle-outline" label="Unsure match" />
            ) : null}
          </Stack>
          {!related ? (
            <Text color="secondary">Not about your applications. Nothing to do.</Text>
          ) : matched === undefined ? (
            <Text color="secondary">Not matched to any of your applications.</Text>
          ) : (
            <MatchedApplication
              application={matched}
              prefix={mustChoose ? 'Best guess' : 'For'}
              size="md"
            />
          )}
          {related && step === undefined ? (
            <Text color="secondary">No Next Step proposed.</Text>
          ) : null}
        </Stack>
      </Card>

      {related && step !== undefined ? (
        <ProposedStep
          title={step.title}
          due={formatDueDate(step.dueDate, new Date())}
          decision={decision}
          replayed={replayed}
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
              variant="primary"
              disabled={targetId === null}
              {...(targetId === null ? { accessibilityHint: 'Choose an application first' } : {})}
              onPress={() => {
                if (targetId !== null) onAccept(targetId);
              }}
            />
            <Button label="Dismiss" variant="secondary" onPress={onDismiss} />
          </Stack>
        </ProposedStep>
      ) : null}
    </Stack>
  );
}

/**
 * The proposed Next Step. While undecided it is a `ProposalCard` (not saved); once accepted or
 * dismissed it is a plain card, because nothing is pending any more.
 */
function ProposedStep({
  title,
  due,
  decision,
  replayed,
  targetCompany,
  children,
}: {
  title: string;
  due: string;
  decision: ProposalDecision;
  replayed: boolean;
  targetCompany: string | undefined;
  children: ReactNode;
}) {
  const step = (
    <Stack gap={1}>
      <Text variant="heading">Proposed Next Step</Text>
      <Text variant="departure">{title}</Text>
      <Text variant="board" color="secondary">{`Due: ${due}`}</Text>
    </Stack>
  );
  if (decision === 'open') {
    return (
      // Replayed results were recorded earlier, so they don't claim to be on-device output (INBX-6).
      <ProposalCard eyebrow="PROPOSED · FROM EMAIL" onDevice={!replayed}>
        <Stack gap={4}>
          {step}
          {children}
        </Stack>
      </ProposalCard>
    );
  }
  return (
    <Card variant="surface">
      <Stack gap={3}>
        {step}
        {decision === 'accepted' ? (
          <Banner
            tone="success"
            title={`Next Step added${targetCompany === undefined ? '' : ` to ${targetCompany}`}`}
          />
        ) : (
          <Text color="secondary">Dismissed. Nothing was changed.</Text>
        )}
      </Stack>
    </Card>
  );
}
