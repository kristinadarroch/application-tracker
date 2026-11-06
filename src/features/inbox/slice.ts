import {
  createEntityAdapter,
  createSlice,
  type EntityState,
  type PayloadAction,
} from '@reduxjs/toolkit';

import { applicationRemoved } from '@/features/applications/model';
import type { AppError } from '@/lib/errors';
import type { MessageId } from '@/lib/ids';

import { deliverFixture } from './mockEmailSource';
import type { EmailSourceKind, InboxMessage, ProposalDecision, TriageState } from './schema';
import { triageApi } from './triageApi';

/** Newest first (INBX-1). */
export const messagesAdapter = createEntityAdapter<InboxMessage, MessageId>({
  selectId: (message) => message.id,
  sortComparer: (a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt),
});

export interface InboxState {
  messages: EntityState<InboxMessage, MessageId>;
  /** Keyed by message so one failed Triage never affects another (INBX-5). No entry: not triaged yet. */
  triage: Partial<Record<MessageId, TriageState>>;
  /** Index of the next sample message to deliver (INBX-6). */
  fixtureCursor: number;
  /** The Email Source new messages come from. */
  source: EmailSourceKind;
}

const initialState: InboxState = {
  messages: messagesAdapter.getInitialState(),
  triage: {},
  fixtureCursor: 0,
  source: 'mock',
};

const { matchPending, matchFulfilled, matchRejected } = triageApi.endpoints.triageMessage;

export const inboxSlice = createSlice({
  name: 'inbox',
  initialState,
  reducers: {
    /** Delivers the next sample message, stamped `now`. No-op once all are delivered. */
    nextFixtureReceived(state, action: PayloadAction<{ now: string }>) {
      const message = deliverFixture(state.fixtureCursor, action.payload.now);
      if (message === undefined) return;
      messagesAdapter.upsertOne(state.messages, message);
      delete state.triage[message.id];
      state.fixtureCursor += 1;
    },
    /** Messages fetched from an Email Source; already-known messages keep their Triage. */
    messagesReceived(state, action: PayloadAction<InboxMessage[]>) {
      messagesAdapter.addMany(state.messages, action.payload);
    },
    proposalDecided(
      state,
      action: PayloadAction<{ messageId: MessageId; decision: Exclude<ProposalDecision, 'open'> }>,
    ) {
      const triage = state.triage[action.payload.messageId];
      if (triage?.status !== 'done') return;
      triage.decision = action.payload.decision;
    },
    messageTaggedManually(state, action: PayloadAction<MessageId>) {
      state.triage[action.payload] = { status: 'manual' };
    },
    /** Switching back to sample email removes Gmail messages, so a real inbox isn't kept around. */
    emailSourceChanged(state, action: PayloadAction<EmailSourceKind>) {
      state.source = action.payload;
      if (action.payload === 'gmail') return;
      const gmailIds = Object.values(state.messages.entities)
        .filter((message) => message.origin === 'gmail')
        .map((message) => message.id);
      messagesAdapter.removeMany(state.messages, gmailIds);
      for (const id of gmailIds) delete state.triage[id];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applicationRemoved, (state, action) => {
        // A match to a deleted application becomes unmatched; the user can pick another (PIPE-5).
        for (const triage of Object.values(state.triage)) {
          if (triage?.status === 'done' && triage.result.applicationId === action.payload) {
            triage.result.applicationId = null;
          }
        }
      })
      .addMatcher(matchPending, (state, action) => {
        const id = action.meta.arg.originalArgs.message.id;
        if (state.messages.entities[id] === undefined) return;
        state.triage[id] = { status: 'pending', startedAt: action.meta.startedTimeStamp };
      })
      // A late result is dropped when the message was removed or tagged by hand meanwhile.
      .addMatcher(matchFulfilled, (state, action) => {
        const id = action.meta.arg.originalArgs.message.id;
        if (state.triage[id]?.status !== 'pending') return;
        const { result, replayed } = action.payload;
        state.triage[id] = { status: 'done', result, replayed, decision: 'open' };
      })
      .addMatcher(matchRejected, (state, action) => {
        const id = action.meta.arg.originalArgs.message.id;
        const current = state.triage[id];
        if (current?.status !== 'pending') return;
        const error: AppError = action.payload ?? {
          kind: 'ai_failed',
          code: action.error.message ?? 'unknown',
        };
        state.triage[id] = { status: 'failed', error, startedAt: current.startedAt };
      });
  },
});

export const {
  nextFixtureReceived,
  messagesReceived,
  proposalDecided,
  messageTaggedManually,
  emailSourceChanged,
} = inboxSlice.actions;
