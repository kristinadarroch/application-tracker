import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { applicationAdded } from '@/features/applications/model';
import { settingsSlice } from '@/features/settings';
import { ApplicationIdSchema, MessageIdSchema, type ApplicationId } from '@/lib/ids';
import { err, ok } from '@/lib/result';
import type { AiAvailability } from '@/services/ai/model';
import { makeStore, type TestStore } from '@/store/store';
import { renderApp } from '@/test/renderApp';
import { renderWithProviders } from '@/test/renderWithProviders';

import { ConnectGmailScreen } from '../components/ConnectGmailScreen';
import { InboxScreen } from '../components/InboxScreen';
import { MessageDetailScreen } from '../components/MessageDetailScreen';
import { useEmailReading } from '../hooks/useEmailReading';
import { FIXTURE_MESSAGES } from '../mockEmailSource';
import { nextFixtureReceived } from '../slice';
import { startTriage } from '../thunks';

const mockGenerate = jest.fn();
jest.mock('@/services/ai/foundationModels', () => ({
  onDeviceModel: {
    availability: () => ({ status: 'available', contextTokens: 4096 }),
    generate: (...args: unknown[]) => mockGenerate(...args),
  },
}));

const acmeId = ApplicationIdSchema.parse('app_acme');
const globexId = ApplicationIdSchema.parse('app_globex');
const AVAILABLE: AiAvailability = { status: 'available', contextTokens: 4096 };
const UNAVAILABLE: AiAvailability = { status: 'unavailable', reason: 'unsupported_platform' };
const UNRELATED = ok({ matchedApplicationId: 'none', category: 'unrelated', confidence: 'high' });

/** Store with two applications and the first `received` sample messages. */
function setup({
  ai = AVAILABLE,
  replay = false,
  received = 2,
}: {
  ai?: AiAvailability;
  replay?: boolean;
  received?: number;
} = {}): TestStore {
  const store = makeStore({
    capabilities: { ai },
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
  for (let i = 0; i < received; i += 1) {
    store.dispatch(
      nextFixtureReceived({ now: new Date(Date.UTC(2026, 10, 5, 9, i)).toISOString() }),
    );
  }
  return store;
}

/** The app-wide reader the root layout mounts; the Inbox only shows its results. */
function EmailReader() {
  useEmailReading();
  return null;
}

const renderInbox = (store: TestStore) =>
  renderWithProviders(
    <>
      <EmailReader />
      <InboxScreen onOpenMessage={jest.fn()} onOpenGmailSettings={jest.fn()} />
    </>,
    { store },
  );

const renderMessage = (store: TestStore, id: string) =>
  renderWithProviders(
    <MessageDetailScreen messageId={MessageIdSchema.parse(id)} onBack={jest.fn()} />,
    { store },
  );

beforeEach(() => mockGenerate.mockReset());

describe('Inbox tab', () => {
  it('lists sender and subject, newest first, and triages new messages automatically (INBX-1)', async () => {
    mockGenerate.mockResolvedValue(UNRELATED);
    await renderInbox(setup());

    const subjects = screen
      .getAllByRole('button', { name: /,/ })
      .map((row) => row.props.accessibilityLabel as string);
    expect(subjects[0]).toMatch(/^Dev Weekly #212.*, Dev Weekly ·/);
    expect(subjects[1]).toMatch(/^Interview invitation.*, Priya Shah ·/);
    await waitFor(() => expect(screen.getAllByText('Unrelated')).toHaveLength(2));
    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it('shows "Couldn’t analyze" and Retry only on the message whose Triage failed (INBX-5)', async () => {
    mockGenerate.mockImplementation(async ({ prompt }: { prompt: string }) =>
      prompt.includes('Interview invitation')
        ? err({ kind: 'timeout', afterMs: 20_000 })
        : UNRELATED,
    );
    await renderInbox(setup());

    expect(await screen.findByText('Couldn’t analyze')).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(1);
    expect(screen.getByText('Unrelated')).toBeOnTheScreen();

    mockGenerate.mockResolvedValue(
      ok({ matchedApplicationId: acmeId, category: 'interview_invite', confidence: 'high' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Interview invite')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('offers "Tag manually" on every message when AI is unavailable (UX-7)', async () => {
    await renderInbox(setup({ ai: UNAVAILABLE }));

    expect(screen.getAllByRole('button', { name: 'Tag manually' })).toHaveLength(2);
    expect(screen.queryByText('Analyzing…')).toBeNull();
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('delivers the next sample email, then disables the button when none are left (INBX-6)', async () => {
    await renderInbox(setup({ ai: UNAVAILABLE, received: FIXTURE_MESSAGES.length - 1 }));

    await fireEvent.press(screen.getByRole('button', { name: 'Receive next email' }));

    expect(
      screen.getByText('Offer: Senior React Native Engineer at Acme Health'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'No more sample emails' })).toBeDisabled();
  });

  it('labels replayed results "Replayed" and never calls the model (INBX-6)', async () => {
    await renderInbox(setup({ ai: UNAVAILABLE, replay: true, received: 1 }));

    expect(await screen.findByText('Replayed')).toBeOnTheScreen();
    expect(screen.getByText('Interview invite')).toBeOnTheScreen();
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('badges a message that updated an application by itself (INBX-7)', async () => {
    // Acme is Applied, so the confident invite moves it to Interviewing.
    await renderInbox(setup({ ai: UNAVAILABLE, replay: true, received: 1 }));

    expect(await screen.findByText('Updated: Interviewing')).toBeOnTheScreen();
  });
});

describe('automatic Triage queue', () => {
  /** Each model call waits until the test settles it, like the one-at-a-time on-device model. */
  function deferredModel() {
    const pending: ((value: unknown) => void)[] = [];
    mockGenerate.mockImplementation(() => {
      const { promise, resolve } = Promise.withResolvers<unknown>();
      pending.push(resolve);
      return promise;
    });
    return {
      settle: async (index: number, value: unknown) => {
        await act(async () => pending[index]!(value));
      },
    };
  }

  it('sends one request at a time', async () => {
    const model = deferredModel();
    await renderInbox(setup({ received: 3 }));

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('Waiting to analyze')).toHaveLength(2);

    await model.settle(0, UNRELATED);
    await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Unrelated')).toBeOnTheScreen();
    await waitFor(() => expect(screen.getAllByText('Waiting to analyze')).toHaveLength(1));
    await model.settle(1, UNRELATED);
    await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(3));
    await model.settle(2, UNRELATED);
    await waitFor(() => expect(screen.getAllByText('Unrelated')).toHaveLength(3));
  });

  it('pauses after a time-out and resumes with "Analyze remaining"', async () => {
    const model = deferredModel();
    await renderInbox(setup({ received: 3 }));

    await model.settle(0, err({ kind: 'timeout', afterMs: 20_000 }));

    expect(await screen.findByText('Analysis paused')).toBeOnTheScreen();
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('Waiting to analyze')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(1);

    await fireEvent.press(screen.getByRole('button', { name: 'Analyze remaining' }));

    await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Analysis paused')).toBeNull();
    await model.settle(1, UNRELATED);
    await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(3));
    await model.settle(2, UNRELATED);
    await waitFor(() => expect(screen.getAllByText('Unrelated')).toHaveLength(2));
  });
});

describe('Message detail', () => {
  it('shows what a confident email changed, and Undo puts it back (INBX-7)', async () => {
    const store = setup({ ai: UNAVAILABLE, replay: true, received: 1 });
    await store.dispatch(startTriage(MessageIdSchema.parse('msg_fixture_acme_invite')));
    await renderMessage(store, 'msg_fixture_acme_invite');

    expect(screen.getByText('For: Acme Health — Senior React Native Engineer')).toBeOnTheScreen();
    expect(screen.getByText('Updated from email')).toBeOnTheScreen();
    expect(screen.getByText('Stage: Applied → Interviewing')).toBeOnTheScreen();
    expect(screen.getByText('Next Step added: Book technical interview')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

    expect(store.getState().applications.entities[acmeId]).toMatchObject({
      stage: 'applied',
      nextSteps: [],
    });
    expect(screen.getByText('Undone. Changes you made yourself were kept.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it('requires choosing the application for a low-confidence match before accepting (INBX-4)', async () => {
    // The fifth sample message is the recruiter follow-up, replayed as a low-confidence Globex match.
    const store = setup({ ai: UNAVAILABLE, replay: true, received: 5 });
    await store.dispatch(startTriage(MessageIdSchema.parse('msg_fixture_recruiter_followup')));
    await renderMessage(store, 'msg_fixture_recruiter_followup');

    expect(screen.getByText('Replayed')).toBeOnTheScreen();
    expect(screen.getByText('Which application is this about?')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();

    await fireEvent.press(screen.getByRole('button', { name: 'Globex — Mobile Engineer' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Accept' }));

    expect(store.getState().applications.entities[globexId]?.nextSteps).toEqual([
      expect.objectContaining({
        title: 'Send resume and call times to recruiter',
        source: 'inbox',
      }),
    ]);
    expect(screen.getByText('Next Step added to Globex')).toBeOnTheScreen();
  });

  it('dismissing a proposal changes nothing (INBX-2)', async () => {
    const store = setup({ ai: UNAVAILABLE, replay: true, received: 5 });
    await store.dispatch(startTriage(MessageIdSchema.parse('msg_fixture_recruiter_followup')));
    await renderMessage(store, 'msg_fixture_recruiter_followup');
    const before = store.getState().applications;

    await fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));

    expect(store.getState().applications).toBe(before);
    expect(screen.getByText('Dismissed. Nothing was changed.')).toBeOnTheScreen();
  });

  it('tags a message manually and adds the Next Step to the chosen application (INBX-5)', async () => {
    const store = setup({ ai: UNAVAILABLE, received: 1 });
    await renderMessage(store, 'msg_fixture_acme_invite');

    await fireEvent.press(screen.getByRole('button', { name: 'Add Next Step' }));
    expect(screen.getByText('Choose an application')).toBeOnTheScreen();
    expect(screen.getByText('Add a title')).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Acme Health — Senior React Native Engineer' }),
    );
    await fireEvent.changeText(screen.getByLabelText('Next Step'), 'Book interview');
    await fireEvent.press(screen.getByRole('button', { name: 'In 3 days' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add Next Step' }));

    expect(store.getState().applications.entities[acmeId]?.nextSteps).toEqual([
      expect.objectContaining({
        title: 'Book interview',
        source: 'inbox',
        messageId: 'msg_fixture_acme_invite',
      }),
    ]);
    expect(screen.getByText('Tagged manually')).toBeOnTheScreen();
  });
});

describe('Updates from email on the application (INBX-7)', () => {
  it('logs what the email changed, with Undo while there is something to undo', async () => {
    const store = setup({ ai: UNAVAILABLE, replay: true, received: 1 });
    await store.dispatch(startTriage(MessageIdSchema.parse('msg_fixture_acme_invite')));
    await renderApp('/application/app_acme', { store });

    expect(screen.getByText('Updates from email')).toBeOnTheScreen();
    expect(
      screen.getByText('Interview invitation: Senior React Native Engineer'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Stage: Applied → Interviewing')).toBeOnTheScreen();
    expect(screen.getByText('Next Step added: Book technical interview')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

    expect(store.getState().applications.entities[acmeId]).toMatchObject({
      stage: 'applied',
      nextSteps: [],
    });
    expect(screen.getByText('Undone')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it('shows nothing for an application no email has changed', async () => {
    await renderApp('/application/app_globex', { store: setup({ received: 0 }) });

    expect(screen.queryByText('Updates from email')).toBeNull();
  });
});

describe('Connect Gmail (LATER-2)', () => {
  it('explains setup and keeps Connect disabled when no OAuth client id is configured', async () => {
    await renderWithProviders(<ConnectGmailScreen onBack={jest.fn()} clientId={undefined} />);

    expect(screen.getByText('Gmail isn’t set up in this build')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Connect Gmail' })).toBeDisabled();
    expect(screen.getByText('Sample emails')).toBeOnTheScreen();
  });
});
