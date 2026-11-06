import { applicationAdded, applicationRemoved } from '@/features/applications/model';
import { settingsSlice } from '@/features/settings';
import { ApplicationIdSchema, MessageIdSchema, type ApplicationId } from '@/lib/ids';
import { err, ok } from '@/lib/result';
import { makeStore } from '@/store/store';

import { FIXTURE_MESSAGES } from '../mockEmailSource';
import type { InboxMessage } from '../schema';
import { selectHasMoreFixtures, selectInboxMessages, selectTriage } from '../selectors';
import {
  emailSourceChanged,
  messagesReceived,
  nextFixtureReceived,
  proposalDecided,
} from '../slice';
import { acceptProposal, startTriage } from '../thunks';

const mockGenerate = jest.fn();
jest.mock('@/services/ai/foundationModels', () => ({
  onDeviceModel: {
    availability: () => ({ status: 'available', contextTokens: 4096 }),
    generate: (...args: unknown[]) => mockGenerate(...args),
  },
}));

const acmeId = ApplicationIdSchema.parse('app_acme');
const globexId = ApplicationIdSchema.parse('app_globex');
const inviteId = MessageIdSchema.parse('msg_fixture_acme_invite');

function setup({ replay = false }: { replay?: boolean } = {}) {
  const store = makeStore({
    capabilities: { ai: { status: 'available', contextTokens: 4096 } },
    settings: { ...settingsSlice.getInitialState(), aiReplay: replay },
  });
  const add = (id: ApplicationId, company: string, role: string) =>
    store.dispatch(
      applicationAdded({
        id,
        input: {
          company,
          role,
          location: undefined,
          salary: undefined,
          listingUrl: undefined,
          stage: 'applied',
          notes: '',
          requirements: [],
        },
        now: '2026-11-01T10:00:00.000Z',
      }),
    );
  add(acmeId, 'Acme Health', 'Senior React Native Engineer');
  add(globexId, 'Globex', 'Mobile Engineer');
  return store;
}

const inviteOutput = {
  matchedApplicationId: acmeId,
  category: 'interview_invite',
  confidence: 'high',
  nextStepTitle: 'Book interview',
  dueInDays: 2,
};

beforeEach(() => mockGenerate.mockReset());

describe('receiving sample email (INBX-6)', () => {
  it('delivers fixtures one at a time, newest first, and stops at the end', () => {
    const store = setup();
    for (let i = 0; i <= FIXTURE_MESSAGES.length; i += 1) {
      store.dispatch(
        nextFixtureReceived({ now: new Date(Date.UTC(2026, 10, 5, 9, i)).toISOString() }),
      );
    }
    const messages = selectInboxMessages(store.getState());
    expect(messages).toHaveLength(FIXTURE_MESSAGES.length);
    expect(messages[0]?.id).toBe(FIXTURE_MESSAGES.at(-1)?.id);
    expect(store.getState().inbox.fixtureCursor).toBe(FIXTURE_MESSAGES.length);
    expect(selectHasMoreFixtures(store.getState())).toBe(false);
  });
});

describe('Triage', () => {
  it('asks the model with the candidate applications and records a linked proposal', async () => {
    const store = setup();
    store.dispatch(nextFixtureReceived({ now: '2026-11-05T12:00:00.000Z' }));
    mockGenerate.mockResolvedValueOnce(ok(inviteOutput));

    await store.dispatch(startTriage(inviteId));

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining(`id: ${acmeId} | Acme Health`),
        timeoutMs: 20_000,
        deterministic: true,
      }),
    );
    expect(selectTriage(store.getState(), inviteId)).toMatchObject({
      status: 'done',
      replayed: false,
      decision: 'open',
      result: { applicationId: acmeId, proposedNextStep: { title: 'Book interview' } },
    });
  });

  it('records the failure on that message only', async () => {
    const store = setup();
    store.dispatch(nextFixtureReceived({ now: '2026-11-05T12:00:00.000Z' }));
    mockGenerate.mockResolvedValueOnce(err({ kind: 'timeout', afterMs: 20_000 }));

    await store.dispatch(startTriage(inviteId));

    expect(selectTriage(store.getState(), inviteId)).toEqual({
      status: 'failed',
      error: { kind: 'timeout', afterMs: 20_000 },
    });
  });

  it('uses the recorded result in AI Replay, marks it replayed, and never calls the model', async () => {
    const store = setup({ replay: true });
    store.dispatch(nextFixtureReceived({ now: '2026-11-05T12:00:00.000Z' }));

    await store.dispatch(startTriage(inviteId));

    expect(mockGenerate).not.toHaveBeenCalled();
    expect(selectTriage(store.getState(), inviteId)).toMatchObject({
      status: 'done',
      replayed: true,
      result: { category: 'interview_invite', applicationId: acmeId },
    });
  });
});

async function triagedStore() {
  const store = setup();
  store.dispatch(nextFixtureReceived({ now: '2026-11-05T12:00:00.000Z' }));
  mockGenerate.mockResolvedValueOnce(ok(inviteOutput));
  await store.dispatch(startTriage(inviteId));
  return store;
}

describe('proposals (INBX-2)', () => {
  it('accepting adds the Next Step to the matched application', async () => {
    const store = await triagedStore();

    const result = store.dispatch(
      acceptProposal({
        messageId: inviteId,
        applicationId: acmeId,
        now: '2026-11-05T12:05:00.000Z',
      }),
    );

    expect(result.ok).toBe(true);
    expect(store.getState().applications.entities[acmeId]?.nextSteps).toEqual([
      expect.objectContaining({
        title: 'Book interview',
        source: 'inbox',
        messageId: inviteId,
        done: false,
      }),
    ]);
    expect(selectTriage(store.getState(), inviteId)).toMatchObject({ decision: 'accepted' });
  });

  it('dismissing changes nothing on applications', async () => {
    const store = await triagedStore();
    const before = store.getState().applications;

    store.dispatch(proposalDecided({ messageId: inviteId, decision: 'dismissed' }));

    expect(store.getState().applications).toBe(before);
    expect(selectTriage(store.getState(), inviteId)).toMatchObject({ decision: 'dismissed' });
  });

  it('removing the matched application leaves the message unmatched', async () => {
    const store = await triagedStore();

    store.dispatch(applicationRemoved(acmeId));

    expect(selectTriage(store.getState(), inviteId)).toMatchObject({
      status: 'done',
      result: { applicationId: null },
    });
  });
});

describe('Email Source', () => {
  it('switching back to sample email removes Gmail messages', () => {
    const store = setup();
    store.dispatch(nextFixtureReceived({ now: '2026-11-05T12:00:00.000Z' }));
    const gmailMessage: InboxMessage = {
      id: MessageIdSchema.parse('gmail_1'),
      from: 'someone@example.com',
      subject: 'Hello',
      receivedAt: '2026-11-05T13:00:00.000Z',
      bodyText: 'Hi',
      origin: 'gmail',
    };
    store.dispatch(emailSourceChanged('gmail'));
    store.dispatch(messagesReceived([gmailMessage]));

    store.dispatch(emailSourceChanged('mock'));

    expect(selectInboxMessages(store.getState()).map((m) => m.id)).toEqual([inviteId]);
    expect(store.getState().inbox.source).toBe('mock');
  });
});
