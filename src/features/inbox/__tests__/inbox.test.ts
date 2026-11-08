import {
  applicationAdded,
  applicationRemoved,
  nextStepToggled,
  stageChanged,
  type Application,
} from '@/features/applications/model';
import { settingsSlice } from '@/features/settings';
import { ApplicationIdSchema, MessageIdSchema, type ApplicationId } from '@/lib/ids';
import { err, ok } from '@/lib/result';
import { STAGES, type Stage } from '@/lib/stage';
import { makeStore, type TestStore } from '@/store/store';

import { FIXTURE_MESSAGES } from '../mockEmailSource';
import type { InboxMessage, TriageCategory } from '../schema';
import {
  selectCanUndo,
  selectEmailUpdate,
  selectEmailUpdatesForApplication,
  selectHasMoreFixtures,
  selectInboxMessages,
  selectTriage,
} from '../selectors';
import {
  emailSourceChanged,
  emailUpdateApplied,
  messagesReceived,
  nextFixtureReceived,
  proposalDecided,
} from '../slice';
import { stageFromTriage } from '../stageFromTriage';
import { acceptProposal, startTriage, syncGmail, undoEmailUpdate } from '../thunks';

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

function setup({
  replay = false,
  acmeStage = 'applied',
}: { replay?: boolean; acmeStage?: Stage } = {}) {
  const store = makeStore({
    capabilities: { ai: { status: 'available', contextTokens: 4096 } },
    settings: { ...settingsSlice.getInitialState(), aiReplay: replay },
  });
  const add = (id: ApplicationId, company: string, role: string, stage: Stage) =>
    store.dispatch(
      applicationAdded({
        id,
        input: {
          company,
          role,
          location: undefined,
          salary: undefined,
          listingUrl: undefined,
          stage,
          notes: '',
          requirements: [],
        },
        now: '2026-11-01T10:00:00.000Z',
      }),
    );
  add(acmeId, 'Acme Health', 'Senior React Native Engineer', acmeStage);
  add(globexId, 'Globex', 'Mobile Engineer', 'applied');
  return store;
}

const acme = (store: TestStore): Application => {
  const application = store.getState().applications.entities[acmeId];
  if (application === undefined) throw new Error('Acme is missing');
  return application;
};

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

describe('stageFromTriage (ADR 0007)', () => {
  const expected: Record<TriageCategory, Record<Stage, Stage | undefined>> = {
    interview_invite: {
      saved: 'interviewing',
      applied: 'interviewing',
      interviewing: undefined,
      offer: undefined,
      rejected: undefined,
      withdrawn: undefined,
    },
    scheduling: {
      saved: 'interviewing',
      applied: 'interviewing',
      interviewing: undefined,
      offer: undefined,
      rejected: undefined,
      withdrawn: undefined,
    },
    take_home: {
      saved: 'interviewing',
      applied: 'interviewing',
      interviewing: undefined,
      offer: undefined,
      rejected: undefined,
      withdrawn: undefined,
    },
    offer: {
      saved: 'offer',
      applied: 'offer',
      interviewing: 'offer',
      offer: undefined,
      rejected: undefined,
      withdrawn: undefined,
    },
    rejection: {
      saved: 'rejected',
      applied: 'rejected',
      interviewing: 'rejected',
      offer: 'rejected',
      rejected: undefined,
      withdrawn: undefined,
    },
    recruiter_followup: {
      saved: undefined,
      applied: undefined,
      interviewing: undefined,
      offer: undefined,
      rejected: undefined,
      withdrawn: undefined,
    },
    unrelated: {
      saved: undefined,
      applied: undefined,
      interviewing: undefined,
      offer: undefined,
      rejected: undefined,
      withdrawn: undefined,
    },
  };
  const cases = Object.entries(expected).flatMap(([category, byStage]) =>
    STAGES.map((stage) => [category as TriageCategory, stage, byStage[stage]] as const),
  );

  it.each(cases)('%s on a %s application → %s', (category, current, next) => {
    expect(stageFromTriage(category, current)).toBe(next);
  });
});

describe('Triage', () => {
  it('asks the model with the candidate applications and links the result', async () => {
    const store = setup();
    store.dispatch(nextFixtureReceived({ now: '2026-11-05T12:00:00.000Z' }));
    mockGenerate.mockResolvedValueOnce(ok(inviteOutput));

    await store.dispatch(startTriage(inviteId));

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining(`id: ${acmeId} | Acme Health`),
        timeoutMs: 20_000,
        maxOutputTokens: 200,
        sampling: 'repeatable',
      }),
    );
    expect(selectTriage(store.getState(), inviteId)).toMatchObject({
      status: 'done',
      replayed: false,
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
      startedAt: expect.any(Number),
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

async function triagedStore(
  output: Record<string, unknown> = inviteOutput,
  options: { replay?: boolean; acmeStage?: Stage } = {},
) {
  const store = setup(options);
  store.dispatch(nextFixtureReceived({ now: '2026-11-05T12:00:00.000Z' }));
  mockGenerate.mockResolvedValueOnce(ok(output));
  await store.dispatch(startTriage(inviteId));
  return store;
}

describe('confident updates apply by themselves (INBX-7)', () => {
  it('moves the Stage and adds the Next Step, and logs an Email Update', async () => {
    const store = await triagedStore();

    expect(acme(store).stage).toBe('interviewing');
    const step = acme(store).nextSteps[0];
    expect(acme(store).nextSteps).toEqual([
      expect.objectContaining({
        title: 'Book interview',
        source: 'inbox',
        messageId: inviteId,
        done: false,
      }),
    ]);
    expect(selectTriage(store.getState(), inviteId)).toMatchObject({ decision: 'auto_applied' });
    expect(selectEmailUpdate(store.getState(), inviteId)).toEqual({
      messageId: inviteId,
      applicationId: acmeId,
      subject: 'Interview invitation: Senior React Native Engineer',
      previousStage: 'applied',
      newStage: 'interviewing',
      nextStepId: step?.id,
      nextStepTitle: 'Book interview',
      replayed: false,
      appliedAt: expect.any(String),
    });
    expect(selectEmailUpdatesForApplication(store.getState(), acmeId)).toHaveLength(1);
  });

  it('adds only the Next Step when the application is already at that Stage', async () => {
    const store = await triagedStore(inviteOutput, { acmeStage: 'interviewing' });

    expect(acme(store).stage).toBe('interviewing');
    expect(acme(store).nextSteps).toHaveLength(1);
    expect(selectEmailUpdate(store.getState(), inviteId)).not.toHaveProperty('newStage');
  });

  it('never changes a closed application: the email waits as a proposal instead', async () => {
    const store = await triagedStore(inviteOutput, { acmeStage: 'withdrawn' });

    expect(acme(store).stage).toBe('withdrawn');
    expect(acme(store).nextSteps).toEqual([]);
    expect(selectTriage(store.getState(), inviteId)).toMatchObject({ decision: 'open' });
    expect(selectEmailUpdate(store.getState(), inviteId)).toBeUndefined();
  });

  it('leaves a low-confidence match as a proposal', async () => {
    const store = await triagedStore({ ...inviteOutput, confidence: 'low' });

    expect(acme(store).stage).toBe('applied');
    expect(acme(store).nextSteps).toEqual([]);
    expect(selectTriage(store.getState(), inviteId)).toMatchObject({ decision: 'open' });
    expect(selectEmailUpdate(store.getState(), inviteId)).toBeUndefined();
  });

  it('leaves an unmatched message as a proposal', async () => {
    const store = await triagedStore({ ...inviteOutput, matchedApplicationId: 'none' });

    expect(acme(store).stage).toBe('applied');
    expect(selectTriage(store.getState(), inviteId)).toMatchObject({
      decision: 'open',
      result: { applicationId: null },
    });
    expect(store.getState().inbox.updates).toEqual({});
  });

  it('applies AI Replay results the same way, marked replayed', async () => {
    const store = setup({ replay: true });
    store.dispatch(nextFixtureReceived({ now: '2026-11-05T12:00:00.000Z' }));

    await store.dispatch(startTriage(inviteId));

    expect(acme(store).stage).toBe('interviewing');
    expect(acme(store).nextSteps).toEqual([
      expect.objectContaining({ title: 'Book technical interview' }),
    ]);
    expect(selectEmailUpdate(store.getState(), inviteId)).toMatchObject({ replayed: true });
  });
});

describe('the application log', () => {
  it('lists Email Updates for that application only, newest first', () => {
    const store = setup();
    const update = (messageId: string, applicationId: ApplicationId, appliedAt: string) =>
      store.dispatch(
        emailUpdateApplied({
          messageId: MessageIdSchema.parse(messageId),
          applicationId,
          subject: messageId,
          previousStage: 'applied',
          newStage: 'interviewing',
          replayed: false,
          appliedAt,
        }),
      );
    update('msg_old', acmeId, '2026-11-02T10:00:00.000Z');
    update('msg_new', acmeId, '2026-11-04T10:00:00.000Z');
    update('msg_other', globexId, '2026-11-05T10:00:00.000Z');

    expect(
      selectEmailUpdatesForApplication(store.getState(), acmeId).map((u) => u.messageId),
    ).toEqual(['msg_new', 'msg_old']);
  });
});

describe('Undo (INBX-7)', () => {
  const undo = (store: TestStore) =>
    store.dispatch(undoEmailUpdate({ messageId: inviteId, now: '2026-11-05T13:00:00.000Z' }));

  it('puts the Stage back and removes the Next Step', async () => {
    const store = await triagedStore();

    undo(store);

    expect(acme(store).stage).toBe('applied');
    expect(acme(store).nextSteps).toEqual([]);
    expect(selectTriage(store.getState(), inviteId)).toMatchObject({ decision: 'undone' });
    expect(selectEmailUpdate(store.getState(), inviteId)).toMatchObject({
      undoneAt: '2026-11-05T13:00:00.000Z',
    });
    expect(selectCanUndo(store.getState(), inviteId)).toBe(false);
  });

  it('does nothing the second time', async () => {
    const store = await triagedStore();
    undo(store);
    store.dispatch(
      stageChanged({ id: acmeId, stage: 'interviewing', now: '2026-11-05T14:00:00Z' }),
    );
    const before = store.getState();

    undo(store);

    expect(store.getState()).toBe(before);
  });

  it('keeps what the user changed since: a new Stage and a finished Next Step', async () => {
    const store = await triagedStore();
    const stepId = acme(store).nextSteps[0]?.id;
    if (stepId === undefined) throw new Error('No step');
    store.dispatch(stageChanged({ id: acmeId, stage: 'offer', now: '2026-11-05T12:30:00.000Z' }));
    store.dispatch(
      nextStepToggled({ applicationId: acmeId, id: stepId, now: '2026-11-05T12:31:00.000Z' }),
    );

    expect(selectCanUndo(store.getState(), inviteId)).toBe(false);
    undo(store);

    expect(acme(store).stage).toBe('offer');
    expect(acme(store).nextSteps).toEqual([expect.objectContaining({ id: stepId, done: true })]);
    expect(selectTriage(store.getState(), inviteId)).toMatchObject({ decision: 'undone' });
  });

  it('removes the Next Step but keeps a Stage the user changed', async () => {
    const store = await triagedStore();
    store.dispatch(stageChanged({ id: acmeId, stage: 'offer', now: '2026-11-05T12:30:00.000Z' }));

    undo(store);

    expect(acme(store).stage).toBe('offer');
    expect(acme(store).nextSteps).toEqual([]);
  });
});

describe('proposals (INBX-2, INBX-4)', () => {
  const unsure = { ...inviteOutput, confidence: 'low' };

  it('accepting adds the Next Step and moves the Stage of the chosen application', async () => {
    const store = await triagedStore(unsure);

    const result = store.dispatch(
      acceptProposal({
        messageId: inviteId,
        applicationId: acmeId,
        now: '2026-11-05T12:05:00.000Z',
      }),
    );

    expect(result.ok).toBe(true);
    expect(acme(store).stage).toBe('interviewing');
    expect(acme(store).nextSteps).toEqual([
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
    const store = await triagedStore(unsure);
    const before = store.getState().applications;

    store.dispatch(proposalDecided({ messageId: inviteId, decision: 'dismissed' }));

    expect(store.getState().applications).toBe(before);
    expect(selectTriage(store.getState(), inviteId)).toMatchObject({ decision: 'dismissed' });
  });

  it('removing the matched application leaves the message unmatched', async () => {
    const store = await triagedStore(unsure);

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

  it('drops a Gmail sync that finishes after Gmail was disconnected', async () => {
    const store = setup();
    store.dispatch(emailSourceChanged('gmail'));
    let respond: (messages: InboxMessage[]) => void = () => undefined;
    const source = {
      listRecent: () =>
        new Promise<ReturnType<typeof ok<InboxMessage[]>>>((resolve) => {
          respond = (messages) => resolve(ok(messages));
        }),
    };
    const sync = store.dispatch(syncGmail(source, new Date('2026-11-05T14:00:00.000Z')));

    store.dispatch(emailSourceChanged('mock'));
    respond([
      {
        id: MessageIdSchema.parse('gmail_late'),
        from: 'someone@example.com',
        subject: 'Late',
        receivedAt: '2026-11-05T13:30:00.000Z',
        bodyText: 'Hi',
        origin: 'gmail',
      },
    ]);

    expect(await sync).toEqual(ok(0));
    expect(selectInboxMessages(store.getState())).toEqual([]);
  });
});
