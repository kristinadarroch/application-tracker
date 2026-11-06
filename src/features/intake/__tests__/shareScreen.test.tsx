import { act, fireEvent, screen } from 'expo-router/testing-library';
import type { SharePayload, UseIncomingShareResult } from 'expo-sharing';

import { ok } from '@/lib/result';

import { fakeModel, type FakeModel } from '../testing/fakeModel';
import { ACME_EXTRACTION, LISTING_PAGE_HTML } from '../testing/fixtures';
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
