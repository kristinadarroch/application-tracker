import { act, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';

import { applicationAdded } from '@/features/applications/model';
import { ApplicationIdSchema, MessageIdSchema } from '@/lib/ids';
import { ok } from '@/lib/result';
import { makeStore } from '@/store/store';
import { renderApp } from '@/test/renderApp';
import { renderWithProviders } from '@/test/renderWithProviders';

import { setGmailAccessToken } from '../gmail/gmailSession';
import { useEmailReading } from '../hooks/useEmailReading';
import { selectEmailUpdate, selectInboxMessages } from '../selectors';
import { nextFixtureReceived } from '../slice';

const mockGenerate = jest.fn();
jest.mock('@/services/ai/foundationModels', () => ({
  onDeviceModel: {
    availability: () => ({ status: 'available', contextTokens: 4096 }),
    generate: (...args: unknown[]) => mockGenerate(...args),
  },
}));

const acmeId = ApplicationIdSchema.parse('app_acme');

function storeWithAcme() {
  const store = makeStore({ capabilities: { ai: { status: 'available', contextTokens: 4096 } } });
  store.dispatch(
    applicationAdded({
      id: acmeId,
      input: {
        company: 'Acme Health',
        role: 'Senior React Native Engineer',
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
  return store;
}

beforeEach(() => mockGenerate.mockReset());

describe('reading email app-wide (INBX-8)', () => {
  it('triages and applies new email while the Inbox tab is not open', async () => {
    mockGenerate.mockResolvedValue(
      ok({
        matchedApplicationId: acmeId,
        category: 'interview_invite',
        confidence: 'high',
        nextStepTitle: 'Book interview',
        dueInDays: 2,
      }),
    );
    const store = storeWithAcme();
    // The Pipeline tab is open; the Inbox screen is never rendered.
    await renderApp('/', { store });

    await act(async () => {
      store.dispatch(nextFixtureReceived({ now: '2026-11-05T12:00:00.000Z' }));
    });

    await waitFor(() =>
      expect(store.getState().applications.entities[acmeId]?.stage).toBe('interviewing'),
    );
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(
      selectEmailUpdate(store.getState(), MessageIdSchema.parse('msg_fixture_acme_invite')),
    ).toMatchObject({ newStage: 'interviewing', nextStepTitle: 'Book interview' });
  });
});

describe('Gmail reading on foreground (INBX-8)', () => {
  const appStateListeners: ((status: AppStateStatus) => void)[] = [];
  const fetchMock = jest.fn();
  const realFetch = globalThis.fetch;

  const json = (body: unknown) => ({ status: 200, ok: true, json: async () => body });

  beforeEach(() => {
    appStateListeners.length = 0;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      appStateListeners.push(listener);
      return { remove: jest.fn() } as unknown as NativeEventSubscription;
    });
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string) =>
      url.includes('?q=')
        ? json({ messages: [{ id: 'abc' }] })
        : json({
            id: 'abc',
            payload: {
              mimeType: 'text/plain',
              headers: [
                { name: 'From', value: 'Priya Shah <priya.shah@acmehealth.com>' },
                { name: 'Subject', value: 'Interview times' },
                { name: 'Date', value: 'Thu, 05 Nov 2026 12:00:00 +0000' },
              ],
              body: { data: 'SGVsbG8' },
            },
          }),
    );
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    act(() => setGmailAccessToken(null));
    globalThis.fetch = realFetch;
    jest.restoreAllMocks();
  });

  function EmailReader() {
    useEmailReading();
    return null;
  }

  const foreground = (status: AppStateStatus) =>
    act(async () => {
      for (const listener of appStateListeners) listener(status);
    });

  it('reads Gmail when the token arrives and each time the app comes back', async () => {
    const store = makeStore();
    await renderWithProviders(<EmailReader />, { store });
    await foreground('active');
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => setGmailAccessToken('token'));

    await waitFor(() => expect(selectInboxMessages(store.getState())).toHaveLength(1));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://gmail.googleapis.com/gmail/v1/users/me/messages?q='),
      { headers: { Authorization: 'Bearer token' } },
    );

    fetchMock.mockClear();
    await foreground('background');
    expect(fetchMock).not.toHaveBeenCalled();

    await foreground('active');
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0]?.[0]).toContain('after%3A');
  });
});
