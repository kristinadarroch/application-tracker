import {
  nextStepAdded,
  nextStepRemoved,
  selectApplicationById,
  stageChanged,
} from '@/features/applications/model';
import { selectAiReplay } from '@/features/settings';
import type { IsoDate } from '@/lib/dates';
import type { AppError } from '@/lib/errors';
import { createId, NextStepIdSchema, type ApplicationId, type MessageId } from '@/lib/ids';
import { err, ok, type Result } from '@/lib/result';
import type { AppDispatch, RootState } from '@/store/store';

import type { EmailSource, EmailSourceError } from './emailSource';
import {
  selectEmailSource,
  selectEmailUpdate,
  selectInboxMessages,
  selectIsTriageRunning,
  selectMessageById,
  selectMessagesToTriage,
  selectTriage,
  selectTriageCandidates,
  selectUndoPlan,
} from './selectors';
import {
  emailUpdateApplied,
  emailUpdateUndone,
  messagesReceived,
  messageTaggedManually,
  proposalDecided,
} from './slice';
import { isClosedStage, stageFromTriage } from './stageFromTriage';
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
    dispatch(applyConfidentTriage({ messageId, now: new Date().toISOString() }));
  };
}

/**
 * Applies a confident Triage right away (ADR 0007): high confidence and a matched application
 * that still exists and is still open. Moves the Stage (`stageFromTriage` maps the model's
 * category to a bounded transition) and adds the proposed Next Step, then records an Email Update
 * so the change shows in the log and can be undone. Unsure or unmatched results, and anything
 * about a closed (Rejected or Withdrawn) application, stay open proposals for the user (INBX-4).
 */
export function applyConfidentTriage({
  messageId,
  now,
}: {
  messageId: MessageId;
  now: string;
}): Thunk<void> {
  return (dispatch, getState) => {
    const state = getState();
    const triage = selectTriage(state, messageId);
    const message = selectMessageById(state, messageId);
    if (triage?.status !== 'done' || triage.decision !== 'open' || message === undefined) return;
    const { result } = triage;
    if (result.confidence !== 'high' || result.applicationId === null) return;
    const application = selectApplicationById(state, result.applicationId);
    if (application === undefined || isClosedStage(application.stage)) return;
    const newStage = stageFromTriage(result.category, application.stage);
    const step =
      result.proposedNextStep === undefined
        ? undefined
        : { ...result.proposedNextStep, id: createId(NextStepIdSchema, 'step') };
    if (newStage === undefined && step === undefined) return;

    if (newStage !== undefined) {
      dispatch(stageChanged({ id: application.id, stage: newStage, now }));
    }
    if (step !== undefined) {
      dispatch(
        nextStepAdded({ applicationId: application.id, ...step, source: 'inbox', messageId, now }),
      );
    }
    dispatch(
      emailUpdateApplied({
        messageId,
        applicationId: application.id,
        subject: message.subject,
        previousStage: application.stage,
        ...(newStage === undefined ? {} : { newStage }),
        ...(step === undefined ? {} : { nextStepId: step.id, nextStepTitle: step.title }),
        replayed: triage.replayed,
        appliedAt: now,
      }),
    );
  };
}

/**
 * Reverts exactly what an Email Update applied: the Stage goes back only if the application is
 * still at the Stage the email set, and the Next Step is removed only if it still exists and
 * isn't done. Anything the user changed since stays. Undoing twice does nothing.
 */
export function undoEmailUpdate({
  messageId,
  now,
}: {
  messageId: MessageId;
  now: string;
}): Thunk<void> {
  return (dispatch, getState) => {
    const state = getState();
    const update = selectEmailUpdate(state, messageId);
    if (update === undefined || update.undoneAt !== undefined) return;
    const plan = selectUndoPlan(state, messageId);
    if (plan.restoreStage) {
      dispatch(stageChanged({ id: update.applicationId, stage: update.previousStage, now }));
    }
    if (plan.removeStep && update.nextStepId !== undefined) {
      dispatch(nextStepRemoved({ applicationId: update.applicationId, id: update.nextStepId }));
    }
    dispatch(emailUpdateUndone({ messageId, now }));
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

/**
 * Applies a proposal to the chosen application (INBX-2, INBX-4): the Stage change decided by
 * `stageFromTriage`, and the proposed Next Step.
 */
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
    if (triage?.status !== 'done') return err({ kind: 'not_found', entity: 'message' });
    const application = selectApplicationById(state, applicationId);
    if (application === undefined) return err({ kind: 'not_found', entity: 'application' });
    const newStage = stageFromTriage(triage.result.category, application.stage);
    const step = triage.result.proposedNextStep;
    if (newStage === undefined && step === undefined) {
      return err({ kind: 'not_found', entity: 'message' });
    }
    if (newStage !== undefined) dispatch(stageChanged({ id: applicationId, stage: newStage, now }));
    if (step !== undefined) {
      dispatch(
        nextStepAdded({
          applicationId,
          id: createId(NextStepIdSchema, 'step'),
          ...step,
          source: 'inbox',
          messageId,
          now,
        }),
      );
    }
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

/**
 * Fetches Gmail messages newer than the newest one already in the inbox. Resolves to the count
 * added. Drops the result if Gmail was disconnected while the request was in flight, so a late
 * response never brings Gmail mail back after it was cleared.
 */
export function syncGmail(
  source: EmailSource,
  now: Date,
): Thunk<Promise<Result<number, EmailSourceError>>> {
  return async (dispatch, getState) => {
    const newestGmail = selectInboxMessages(getState()).find((m) => m.origin === 'gmail');
    const since = newestGmail?.receivedAt ?? new Date(now.getTime() - SYNC_WINDOW_MS).toISOString();
    const result = await source.listRecent(since);
    if (!result.ok) return result;
    if (selectEmailSource(getState()) !== 'gmail') return ok(0);
    dispatch(messagesReceived(result.value));
    return ok(result.value.length);
  };
}
