import { createSelector } from '@reduxjs/toolkit';

import { selectAllApplications, selectApplicationById } from '@/features/applications/model';
import { selectAiAvailability } from '@/features/capabilities';
import { selectAiReplay } from '@/features/settings';
import type { ApplicationId, MessageId } from '@/lib/ids';
import type { Stage } from '@/lib/stage';
import type { AiAvailability } from '@/services/ai/model';
import type { RootState } from '@/store/store';

import { FIXTURE_MESSAGES } from './mockEmailSource';
import type { EmailUpdate, InboxMessage, TriageCandidate, TriageState } from './schema';
import { messagesAdapter } from './slice';
import { undoPlan, type UndoPlan } from './stageFromTriage';
import { hasReplayRecording, MAX_CANDIDATES } from './triage';

const adapterSelectors = messagesAdapter.getSelectors((state: RootState) => state.inbox.messages);

/** Newest first (INBX-1). */
export const selectInboxMessages = adapterSelectors.selectAll;
export const selectMessageById = (state: RootState, id: MessageId): InboxMessage | undefined =>
  adapterSelectors.selectById(state, id);
export const selectTriage = (state: RootState, id: MessageId): TriageState | undefined =>
  state.inbox.triage[id];
export const selectEmailSource = (state: RootState) => state.inbox.source;
export const selectHasMoreFixtures = (state: RootState) =>
  state.inbox.fixtureCursor < FIXTURE_MESSAGES.length;

/** Applications offered to Triage as match candidates; the model can't match anything else. */
export const selectTriageCandidates = createSelector(
  [selectAllApplications],
  (applications): TriageCandidate[] =>
    applications.slice(0, MAX_CANDIDATES).map(({ id, company, role }) => ({ id, company, role })),
);

/** Triage can run on the device, or AI Replay has a recording for this message (UX-7, INBX-6). */
function canTriage(id: MessageId, availability: AiAvailability | null, replay: boolean): boolean {
  return availability?.status === 'available' || (replay && hasReplayRecording(id));
}

export const selectCanTriage = (state: RootState, id: MessageId): boolean =>
  canTriage(id, selectAiAvailability(state), selectAiReplay(state));

/**
 * When this JS runtime started. A pending Triage that began earlier was interrupted by an app
 * restart (its request no longer exists), so it is started again.
 */
const LAUNCHED_AT = Date.now();

/** Messages that should be triaged now: never triaged, or interrupted, and Triage can run. */
export const selectMessagesToTriage = createSelector(
  [
    selectInboxMessages,
    (state: RootState) => state.inbox.triage,
    selectAiAvailability,
    selectAiReplay,
  ],
  (messages, triage, availability, replay): InboxMessage[] =>
    messages.filter((message) => {
      const current = triage[message.id];
      return (
        canTriage(message.id, availability, replay) &&
        (current === undefined || (current.status === 'pending' && current.startedAt < LAUNCHED_AT))
      );
    }),
);

/** A Triage request started in this launch is still running. */
export const selectIsTriageRunning = (state: RootState): boolean =>
  Object.values(state.inbox.triage).some(
    (triage) => triage?.status === 'pending' && triage.startedAt >= LAUNCHED_AT,
  );

/**
 * Automatic Triage is paused: a Triage started in this launch timed out after the last
 * "Analyze remaining". The model is likely stuck, so everything queued would time out too.
 */
export const selectTriagePaused = (state: RootState): boolean => {
  const acknowledged = state.inbox.acknowledgedTimeoutAt;
  return Object.values(state.inbox.triage).some(
    (triage) =>
      triage?.status === 'failed' &&
      triage.error.kind === 'timeout' &&
      triage.startedAt >= LAUNCHED_AT &&
      (acknowledged === null || triage.startedAt > acknowledged),
  );
};

/** Current Stage of each application, for showing what accepting a proposal would change. */
export const selectStageByApplication = createSelector(
  [selectAllApplications],
  (applications): Partial<Record<ApplicationId, Stage>> =>
    Object.fromEntries(applications.map((application) => [application.id, application.stage])),
);

export const selectEmailUpdate = (state: RootState, id: MessageId): EmailUpdate | undefined =>
  state.inbox.updates[id];

/** The "Updates from email" log of one application, newest first (ADR 0007). */
export const selectEmailUpdatesForApplication = createSelector(
  [(state: RootState) => state.inbox.updates, (_state: RootState, id: ApplicationId) => id],
  (updates, applicationId): EmailUpdate[] =>
    Object.values(updates)
      .filter((update): update is EmailUpdate => update?.applicationId === applicationId)
      .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)),
);

const NOTHING_TO_UNDO: UndoPlan = { restoreStage: false, removeStep: false };

/** What Undo would revert for this message's Email Update right now. */
export const selectUndoPlan = (state: RootState, id: MessageId): UndoPlan => {
  const update = state.inbox.updates[id];
  if (update === undefined) return NOTHING_TO_UNDO;
  return undoPlan(update, selectApplicationById(state, update.applicationId));
};

export const selectCanUndo = (state: RootState, id: MessageId): boolean => {
  const plan = selectUndoPlan(state, id);
  return plan.restoreStage || plan.removeStep;
};
