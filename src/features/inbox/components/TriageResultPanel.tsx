import { useState, type ReactNode } from 'react';

import { Badge, Banner, Button, Card, ProposalCard, Stack, Text } from '@/design-system';
import { formatDueDate } from '@/lib/dates';
import type { ApplicationId } from '@/lib/ids';
import { STAGE_LABELS, type Stage } from '@/lib/stage';

import type { ProposalDecision, TriageCandidate, TriageResult } from '../schema';
import { canChangeStage, stageFromTriage } from '../stageFromTriage';
import { ApplicationPicker } from './ApplicationPicker';
import { MatchedApplication } from './MatchedApplication';
import { CATEGORY_LABELS, CATEGORY_TONES, REPLAYED_LABEL } from './triageCopy';

export interface TriageResultPanelProps {
  result: TriageResult;
  replayed: boolean;
  decision: ProposalDecision;
  applications: readonly TriageCandidate[];
  /** Current Stage of each application, to show the Stage change accepting would make. */
  stages: Partial<Record<ApplicationId, Stage>>;
  onAccept: (applicationId: ApplicationId) => void;
  onDismiss: () => void;
}

/**
 * A finished Triage: category and matched application, then the proposal (Stage change and Next
 * Step), shown hatched until the user accepts or dismisses it (INBX-2–4). Changes a confident
 * Triage applied by itself are shown by `EmailUpdatePanel` instead (INBX-7).
 */
export function TriageResultPanel({
  result,
  replayed,
  decision,
  applications,
  stages,
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
  const targetStage = targetId === null ? undefined : stages[targetId];
  const newStage =
    targetStage === undefined ? undefined : stageFromTriage(result.category, targetStage);
  // Before an application is chosen, and after the user decided, show the proposal whenever this
  // kind of email can move an application; while open, only when it would move the chosen one.
  const proposesStage =
    targetStage === undefined || decision !== 'open'
      ? canChangeStage(result.category)
      : newStage !== undefined;
  const showProposal =
    related &&
    (step !== undefined || proposesStage) &&
    decision !== 'auto_applied' &&
    decision !== 'undone';

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

      {showProposal ? (
        <Proposal
          step={
            step === undefined
              ? undefined
              : { title: step.title, due: formatDueDate(step.dueDate, new Date()) }
          }
          stageChange={
            targetStage === undefined || newStage === undefined
              ? undefined
              : `Stage: ${STAGE_LABELS[targetStage]} → ${STAGE_LABELS[newStage]}`
          }
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
        </Proposal>
      ) : null}
    </Stack>
  );
}

/**
 * The proposal: the Next Step and, once the application is known, the Stage change. While
 * undecided it is a `ProposalCard` (not saved); once accepted or dismissed it is a plain card,
 * because nothing is pending any more.
 */
function Proposal({
  step,
  stageChange,
  decision,
  replayed,
  targetCompany,
  children,
}: {
  step: { title: string; due: string } | undefined;
  stageChange: string | undefined;
  decision: ProposalDecision;
  replayed: boolean;
  targetCompany: string | undefined;
  children: ReactNode;
}) {
  const proposal = (
    <Stack gap={1}>
      {step === undefined ? (
        <Text variant="heading">Proposed change</Text>
      ) : (
        <>
          <Text variant="heading">Proposed Next Step</Text>
          <Text variant="feature">{step.title}</Text>
          <Text variant="mono" color="secondary">{`Due: ${step.due}`}</Text>
        </>
      )}
      {stageChange !== undefined ? <Text>{stageChange}</Text> : null}
    </Stack>
  );
  if (decision === 'open') {
    return (
      // Replayed results were recorded earlier, so they don't claim to be on-device output (INBX-6).
      <ProposalCard eyebrow="PROPOSED · FROM EMAIL" onDevice={!replayed}>
        <Stack gap={4}>
          {proposal}
          {children}
        </Stack>
      </ProposalCard>
    );
  }
  const where = targetCompany === undefined ? '' : ` to ${targetCompany}`;
  return (
    <Card variant="surface">
      <Stack gap={3}>
        {proposal}
        {decision === 'accepted' ? (
          <Banner
            tone="success"
            title={step === undefined ? `Change applied${where}` : `Next Step added${where}`}
          />
        ) : (
          <Text color="secondary">Dismissed. Nothing was changed.</Text>
        )}
      </Stack>
    </Card>
  );
}
