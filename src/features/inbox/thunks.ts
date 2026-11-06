import { selectApplicationById, nextStepAdded } from '@/features/applications/model';
import { selectAiReplay } from '@/features/settings';
import type { IsoDate } from '@/lib/dates';
import type { AppError } from '@/lib/errors';
import { createId, NextStepIdSchema, type ApplicationId, type MessageId } from '@/lib/ids';
import { err, ok, type Result } from '@/lib/result';
import type { AppDispatch, RootState } from '@/store/store';

import type { EmailSource, EmailSourceError } from './emailSource';
import {
  selectInboxMessages,
  selectIsTriageRunning,
  selectMessageById,
  selectMessagesToTriage,
  selectTriage,
  selectTriageCandidates,
} from './selectors';
import { messagesReceived, messageTaggedManually, proposalDecided } from './slice';
import { triageApi } from './triageApi';

type Thunk<R> = (dispatch: AppDispatch, getState: () => RootState) => R;

/** Runs Triage for one message. The slice records pending, done, or failed. */
export function startTriage(messageId: MessageId): Thunk<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState();
    const message = selectMessageById(state, messageId);
    if (message === undefined) return;
    const request = dispatch(
      triageApi.endpoints.triageMessage.initiate({
        message,
        candidates: selectTriageCandidates(state),
        replay: selectAiReplay(state),
      }),
    );
    await request;
    // The outcome now lives in `inbox.triage`; drop the request cache entry.
    request.reset();
  };
}

/**
 * Starts Triage for the next waiting message, unless one is already running. The on-device
 * model runs one generation at a time, so queued requests would only burn their time limits.
 * Reads fresh state, so calling it again while a request is in flight is a no-op.
 */
export function triageNextMessage(): Thunk<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState();
    if (selectIsTriageRunning(state)) return;
    const next = selectMessagesToTriage(state)[0];
    if (next !== undefined) await dispatch(startTriage(next.id));
  };
}

/** Adds the proposed Next Step to the chosen application (INBX-2, INBX-4). */
export function acceptProposal({
  messageId,
  applicationId,
  now,
}: {
  messageId: MessageId;
  applicationId: ApplicationId;
  now: string;
}): Thunk<Result<void, AppError>> {
  return (dispatch, getState) => {
    const state = getState();
    const triage = selectTriage(state, messageId);
    if (triage?.status !== 'done' || triage.result.proposedNextStep === undefined) {
      return err({ kind: 'not_found', entity: 'message' });
    }
    if (selectApplicationById(state, applicationId) === undefined) {
      return err({ kind: 'not_found', entity: 'application' });
    }
    dispatch(
      nextStepAdded({
        applicationId,
        id: createId(NextStepIdSchema, 'step'),
        ...triage.result.proposedNextStep,
        source: 'inbox',
        messageId,
        now,
      }),
    );
    dispatch(proposalDecided({ messageId, decision: 'accepted' }));
    return ok(undefined);
  };
}

/** The manual path when Triage failed, isn't available, or got it wrong (INBX-5). */
export function tagManually({
  messageId,
  applicationId,
  title,
  dueDate,
  now,
}: {
  messageId: MessageId;
  applicationId: ApplicationId;
  title: string;
  dueDate: IsoDate;
  now: string;
}): Thunk<Result<void, AppError>> {
  return (dispatch, getState) => {
    if (selectApplicationById(getState(), applicationId) === undefined) {
      return err({ kind: 'not_found', entity: 'application' });
    }
    dispatch(
      nextStepAdded({
        applicationId,
        id: createId(NextStepIdSchema, 'step'),
        title,
        dueDate,
        source: 'inbox',
        messageId,
        now,
      }),
    );
    dispatch(messageTaggedManually(messageId));
    return ok(undefined);
  };
}

/** How far back the first sync reads (matches the Gmail `newer_than:30d` query). */
const SYNC_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Fetches Gmail messages newer than the newest one already in the inbox. Resolves to the count added. */
export function syncGmail(
  source: EmailSource,
  now: Date,
): Thunk<Promise<Result<number, EmailSourceError>>> {
  return async (dispatch, getState) => {
    const newestGmail = selectInboxMessages(getState()).find((m) => m.origin === 'gmail');
    const since = newestGmail?.receivedAt ?? new Date(now.getTime() - SYNC_WINDOW_MS).toISOString();
    const result = await source.listRecent(since);
    if (!result.ok) return result;
    dispatch(messagesReceived(result.value));
    return ok(result.value.length);
  };
}
