import { createSelector } from '@reduxjs/toolkit';

import { selectAllApplications } from '@/features/applications/model';
import { selectAiAvailability } from '@/features/capabilities';
import { selectAiReplay } from '@/features/settings';
import type { MessageId } from '@/lib/ids';
import type { AiAvailability } from '@/services/ai/model';
import type { RootState } from '@/store/store';

import { FIXTURE_MESSAGES } from './mockEmailSource';
import type { InboxMessage, TriageCandidate, TriageState } from './schema';
import { messagesAdapter } from './slice';
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
 * Start time of the most recent Triage that timed out, or `null`. Auto-triage pauses after a
 * newer one than it has already acknowledged.
 */
export const selectLatestTimeoutStart = (state: RootState): number | null => {
  let latest: number | null = null;
  for (const triage of Object.values(state.inbox.triage)) {
    if (triage?.status !== 'failed' || triage.error.kind !== 'timeout') continue;
    if (latest === null || triage.startedAt > latest) latest = triage.startedAt;
  }
  return latest;
};
