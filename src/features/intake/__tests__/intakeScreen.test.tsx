import { fireEvent, screen } from 'expo-router/testing-library';

import { err, ok } from '@/lib/result';

import { selectAllDrafts } from '../draftsSlice';
import { fakeModel, type FakeModel } from '../testing/fakeModel';
import { ACME_EXTRACTION, LISTING_PAGE_HTML, LISTING_TEXT } from '../testing/fixtures';
import { renderIntake } from '../testing/renderIntake';

jest.mock('@/services/ai/foundationModels', () => ({
  onDeviceModel: jest.requireActual<{ fakeModel: FakeModel }>('../testing/fakeModel').fakeModel,
}));

const LINK = 'https://careers.acme.example/jobs/42';

async function press(name: string) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

async function pasteText(text: string) {
  await press('Paste text');
  await fireEvent.changeText(screen.getByLabelText('Listing text'), text);
}

/** Pasting a whole link into the empty field starts reading on its own. */
async function pasteLink(link: string) {
  await press('From a link');
  await fireEvent.changeText(screen.getByLabelText('Job link'), link);
}

beforeEach(() => {
  fakeModel.prompts = [];
  fakeModel.nextResult = ok(ACME_EXTRACTION);
});

afterEach(() => jest.restoreAllMocks());

describe('Add from a link (INT-3)', () => {
  it('opens on the link field, and a pasted link loads and drafts with no extra tap', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(LISTING_PAGE_HTML, { headers: { 'content-type': 'text/html' } }),
      );
    const { store, getPathname } = await renderIntake('/intake/new');
    expect(screen.getByRole('button', { name: 'From a link' })).toBeSelected();

    await fireEvent.changeText(screen.getByLabelText('Job link'), LINK);

    expect(await screen.findByText('Review draft')).toBeOnTheScreen();
    const [draft] = selectAllDrafts(store.getState());
    expect(draft?.listingUrl).toBe(LINK);
    expect(getPathname()).toBe(`/intake/review/${draft?.id}`);
  });
});

describe('Paste a listing (INT-2)', () => {
  it('keeps Create draft disabled for empty or whitespace-only text', async () => {
    await renderIntake('/intake/new');
    expect(screen.getByRole('button', { name: 'Create draft' })).toBeDisabled();

    await pasteText('   \n  ');
    expect(screen.getByRole('button', { name: 'Create draft' })).toBeDisabled();
    await press('Create draft');
    expect(fakeModel.prompts).toHaveLength(0);
  });

  it('creates a draft from pasted text and opens it for review', async () => {
    const { store, getPathname } = await renderIntake('/intake/new');
    await pasteText(LISTING_TEXT);
    await press('Create draft');

    expect(await screen.findByDisplayValue('Acme Health')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Senior React Native Engineer')).toBeOnTheScreen();
    const [draft] = selectAllDrafts(store.getState());
    expect(getPathname()).toBe(`/intake/review/${draft?.id}`);
    expect(store.getState().applications.ids).toHaveLength(0);
  });

  it('keeps the text and offers Edit text and Fill in manually when the company is missing', async () => {
    fakeModel.nextResult = ok({ ...ACME_EXTRACTION, company: '' });
    const { getPathname, getSearchParams } = await renderIntake('/intake/new');
    await pasteText(LISTING_TEXT);
    await press('Create draft');

    expect(await screen.findByText('Couldn’t find the company or role')).toBeOnTheScreen();
    expect(screen.getByDisplayValue(LISTING_TEXT)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Edit text' })).toBeOnTheScreen();

    await press('Fill in manually');
    expect(getPathname()).toBe('/application/new');
    expect(getSearchParams()).toMatchObject({
      role: 'Senior React Native Engineer',
      notes: LISTING_TEXT,
    });
  });
});

describe('Recover when extraction fails (INT-5)', () => {
  it('shows an unexpected AI response with Retry, and Retry can still make the draft', async () => {
    fakeModel.nextResult = err({ kind: 'invalid_response', issues: ['role: expected string'] });
    const { getPathname } = await renderIntake('/intake/new');
    await pasteText(LISTING_TEXT);
    await press('Create draft');

    expect(await screen.findByText('Unexpected response')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Fill in manually' })).toBeOnTheScreen();
    fakeModel.nextResult = ok(ACME_EXTRACTION);
    await press('Retry');

    expect(await screen.findByText('Review draft')).toBeOnTheScreen();
    expect(getPathname()).toMatch(/^\/intake\/review\//);
  });

  it('opens the manual form with the pasted text after a timeout', async () => {
    fakeModel.nextResult = err({ kind: 'timeout', afterMs: 20_000 });
    const { getPathname, getSearchParams } = await renderIntake('/intake/new');
    await pasteText(LISTING_TEXT);
    await press('Create draft');

    expect(await screen.findByText('That took too long')).toBeOnTheScreen();
    await press('Fill in manually');
    expect(getPathname()).toBe('/application/new');
    expect(getSearchParams()).toMatchObject({
      notes: LISTING_TEXT,
      aiNote: expect.stringContaining('AI couldn’t read this listing'),
    });
  });

  it('switches to paste mode and keeps the link when offline while loading a URL', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    await renderIntake('/intake/new');
    await pasteLink(LINK);

    expect(await screen.findByText('You’re offline')).toBeOnTheScreen();
    expect(screen.getByLabelText('Listing text')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Paste text' })).toBeSelected();
    expect(screen.getByText(`The link ${LINK} will be saved with this listing.`)).toBeOnTheScreen();
    expect(fakeModel.prompts).toHaveLength(0);
  });

  it('stores the kept link on the draft after pasting the text instead (INT-3)', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Forbidden', { status: 403 }));
    const { store } = await renderIntake('/intake/new');
    await pasteLink(LINK);
    expect(await screen.findByText('Couldn’t read this page')).toBeOnTheScreen();

    await pasteText(LISTING_TEXT);
    await press('Create draft');
    expect(await screen.findByDisplayValue(LINK)).toBeOnTheScreen();
    expect(selectAllDrafts(store.getState())[0]?.listingUrl).toBe(LINK);
  });

  it('asks for a web link before loading anything', async () => {
    await renderIntake('/intake/new');
    await pasteLink('acme.example/jobs');
    expect(fakeModel.prompts).toHaveLength(0);
    await press('Create draft');
    expect(screen.getByText('Enter a link that starts with http:// or https://')).toBeOnTheScreen();
  });
});

describe('AI unavailable (UX-7)', () => {
  it('explains why and continues to the manual form with the text kept', async () => {
    const { getPathname, getSearchParams } = await renderIntake('/intake/new', {
      ai: { status: 'unavailable', reason: 'unsupported_platform' },
    });
    expect(screen.getByText('AI isn’t available')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Create draft' })).toBeNull();

    await pasteText(LISTING_TEXT);
    await press('Continue manually');

    expect(getPathname()).toBe('/application/new');
    expect(getSearchParams()).toMatchObject({
      notes: LISTING_TEXT,
      aiNote: expect.stringContaining('Apple Intelligence'),
    });
    expect(fakeModel.prompts).toHaveLength(0);
  });

  it('keeps a pasted link for the manual form', async () => {
    const { getSearchParams } = await renderIntake('/intake/new', {
      ai: { status: 'unavailable', reason: 'apple_intelligence_unavailable' },
    });
    await pasteLink(LINK);
    await press('Continue manually');
    expect(getSearchParams()).toMatchObject({ listingUrl: LINK });
  });
});
