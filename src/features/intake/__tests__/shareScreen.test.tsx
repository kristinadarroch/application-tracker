import { act, fireEvent, screen } from 'expo-router/testing-library';
import type { SharePayload, UseIncomingShareResult } from 'expo-sharing';

import { ok } from '@/lib/result';

import { selectAllDrafts } from '../draftsSlice';
import { fakeModel, type FakeModel } from '../testing/fakeModel';
import { ACME_EXTRACTION, LISTING_PAGE_HTML, LISTING_TEXT } from '../testing/fixtures';
import { renderIntake } from '../testing/renderIntake';

jest.mock('@/services/ai/foundationModels', () => ({
  onDeviceModel: jest.requireActual<{ fakeModel: FakeModel }>('../testing/fakeModel').fakeModel,
}));

const mockClearSharedPayloads = jest.fn();
let mockSharedPayloads: SharePayload[] = [];

jest.mock('expo-sharing', () => ({
  useIncomingShare: (): UseIncomingShareResult => ({
    sharedPayloads: mockSharedPayloads,
    resolvedSharedPayloads: [],
    clearSharedPayloads: mockClearSharedPayloads,
    isResolving: false,
    error: null,
    refreshSharePayloads: jest.fn(),
  }),
}));

const LINK = 'https://careers.acme.example/jobs/42';

beforeEach(() => {
  fakeModel.prompts = [];
  fakeModel.nextResult = ok(ACME_EXTRACTION);
  mockClearSharedPayloads.mockClear();
});

afterEach(() => jest.restoreAllMocks());

describe('Share a listing from my browser (INT-1)', () => {
  it('opens with the shared URL filled in and starts reading it', async () => {
    mockSharedPayloads = [{ shareType: 'url', value: LINK }];
    const page = Promise.withResolvers<Response>();
    jest.spyOn(globalThis, 'fetch').mockReturnValue(page.promise);

    const { getPathname } = await renderIntake('/intake/share');

    expect(screen.getByText('Shared listing')).toBeOnTheScreen();
    expect(screen.getByLabelText('Job link')).toHaveDisplayValue(LINK);
    expect(screen.getByRole('button', { name: 'Create draft' })).toBeBusy();
    expect(mockClearSharedPayloads).toHaveBeenCalled();

    await act(async () => {
      page.resolve(new Response(LISTING_PAGE_HTML, { headers: { 'content-type': 'text/html' } }));
    });
    expect(await screen.findByText('Review draft')).toBeOnTheScreen();
    expect(getPathname()).toMatch(/^\/intake\/review\//);
  });

  it('says the content can’t be imported and links to adding from a link instead', async () => {
    mockSharedPayloads = [{ shareType: 'image', value: 'file:///photo.jpg' }];
    const { getPathname } = await renderIntake('/intake/share');

    expect(screen.getByText('This can’t be imported')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Add from a link' }));
    expect(getPathname()).toBe('/intake/new');
  });

  it('waits for the user when AI is unavailable', async () => {
    mockSharedPayloads = [{ shareType: 'text', value: 'Acme Health is hiring a Senior Engineer.' }];
    await renderIntake('/intake/share', {
      ai: { status: 'unavailable', reason: 'os_too_old' },
    });

    expect(screen.getByLabelText('Listing text')).toHaveDisplayValue(
      'Acme Health is hiring a Senior Engineer.',
    );
    expect(screen.getByRole('button', { name: 'Continue manually' })).toBeOnTheScreen();
    expect(fakeModel.prompts).toHaveLength(0);
  });
});

describe('Share a LinkedIn job (INT-1)', () => {
  const NOTICE = 'LinkedIn doesn’t let apps read its job pages';
  const CANONICAL = 'https://www.linkedin.com/jobs/view/4426021931/';

  it('waits for the description when iOS shares only the link, and loads nothing', async () => {
    mockSharedPayloads = [
      {
        shareType: 'url',
        value:
          'https://www.linkedin.com/jobs/view/4426021931/?trackingId=Qx2b%2FJ3k%3D%3D&refId=wZu5%3D%3D&trk=flagship3_job_home_savedjobs',
      },
    ];
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    await renderIntake('/intake/share');

    expect(screen.getByText(NOTICE)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Paste text' })).toBeSelected();
    expect(screen.getByLabelText('Listing text')).toHaveDisplayValue('');
    expect(
      screen.getByText(`The link ${CANONICAL} will be saved with this listing.`),
    ).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fakeModel.prompts).toHaveLength(0);
  });

  it('drafts from the text Android shares with the link, and loads nothing', async () => {
    mockSharedPayloads = [
      {
        shareType: 'text',
        value: `Check out this job at Acme Health: ${LISTING_TEXT} https://www.linkedin.com/jobs/view/4426021931.`,
      },
    ];
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    const { store } = await renderIntake('/intake/share');

    expect(await screen.findByText('Review draft')).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fakeModel.prompts[0]).toContain('Check out this job at Acme Health:');
    expect(fakeModel.prompts[0]).not.toContain('linkedin.com');
    const [draft] = selectAllDrafts(store.getState());
    expect(draft?.listingUrl).toBe(CANONICAL);
    expect(draft?.source).toBe('shared');
  });

  it('keeps a short share sentence in the text field and waits for the description', async () => {
    const sentence = 'Check out this job at dYdX: https://www.linkedin.com/jobs/view/123/';
    mockSharedPayloads = [{ shareType: 'text', value: sentence }];
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    await renderIntake('/intake/share');

    expect(screen.getByText(NOTICE)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Paste text' })).toBeSelected();
    expect(screen.getByLabelText('Listing text')).toHaveDisplayValue('Check out this job at dYdX:');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fakeModel.prompts).toHaveLength(0);
  });
});
