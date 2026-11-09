import { act, fireEvent, screen } from 'expo-router/testing-library';

import { aiAvailabilityChecked } from '@/features/capabilities';
import { err, ok } from '@/lib/result';

import { selectAllDrafts } from '../draftsSlice';
import { fakeModel, type FakeModel } from '../testing/fakeModel';
import { ACME_EXTRACTION, LISTING_PAGE_HTML, LISTING_TEXT } from '../testing/fixtures';
import { AI_AVAILABLE, renderIntake } from '../testing/renderIntake';

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
    // WCAG 3.2.2: the user is told before pasting that a pasted link opens the draft by itself.
    expect(screen.getByText(/Pasting a link starts reading it right away/)).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Job link'), LINK);

    expect(await screen.findByText('Review draft')).toBeOnTheScreen();
    const [draft] = selectAllDrafts(store.getState());
    expect(draft?.listingUrl).toBe(LINK);
    expect(getPathname()).toBe(`/intake/review/${draft?.id}`);
  });

  it('waits for Create draft when a link is typed rather than pasted', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    await renderIntake('/intake/new');
    for (const partial of ['h', 'ht', 'https://careers.acme.example/jobs/4', LINK]) {
      await fireEvent.changeText(screen.getByLabelText('Job link'), partial);
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Create draft' })).toBeEnabled();
  });
});

const LINKEDIN_LINK =
  'https://www.linkedin.com/jobs/view/senior-react-native-engineer-at-acme-4426021931/?trk=public_jobs&refId=abc%3D%3D';
const LINKEDIN_CANONICAL = 'https://www.linkedin.com/jobs/view/4426021931/';
const LINKEDIN_NOTICE = 'LinkedIn doesn’t let apps read its job pages';

describe('LinkedIn links (INT-3)', () => {
  it('never loads a pasted LinkedIn link and asks for the description instead', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    const { store } = await renderIntake('/intake/new');
    await fireEvent.changeText(screen.getByLabelText('Job link'), LINKEDIN_LINK);

    expect(screen.getByText(LINKEDIN_NOTICE)).toBeOnTheScreen();
    expect(
      screen.getByText('Paste the job description from LinkedIn, or fill in the details yourself.'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Paste text' })).toBeSelected();
    expect(screen.getByLabelText('Listing text')).toHaveDisplayValue('');
    expect(screen.getByRole('button', { name: 'Fill in manually' })).toBeOnTheScreen();
    expect(fakeModel.prompts).toHaveLength(0);

    await fireEvent.changeText(screen.getByLabelText('Listing text'), LISTING_TEXT);
    await press('Create draft');
    expect(await screen.findByText('Review draft')).toBeOnTheScreen();
    expect(selectAllDrafts(store.getState())[0]?.listingUrl).toBe(LINKEDIN_CANONICAL);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('switches a typed LinkedIn link to paste mode on Create draft', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    await renderIntake('/intake/new');
    for (const partial of ['h', 'https://lnkd.in/gAbC12', 'https://lnkd.in/gAbC123x']) {
      await fireEvent.changeText(screen.getByLabelText('Job link'), partial);
    }
    await press('Create draft');

    expect(screen.getByText(LINKEDIN_NOTICE)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Paste text' })).toBeSelected();
    expect(
      screen.getByText('The link https://lnkd.in/gAbC123x will be saved with this listing.'),
    ).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Open a job link in the app (INT-3)', () => {
  it('fills in the link from intake/new?url= and reads it with no tap', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(LISTING_PAGE_HTML, { headers: { 'content-type': 'text/html' } }),
      );
    const { store, getPathname } = await renderIntake(
      `/intake/new?url=${encodeURIComponent(LINK)}`,
    );

    expect(await screen.findByText('Review draft')).toBeOnTheScreen();
    expect(fetchMock).toHaveBeenCalledWith(LINK, expect.anything());
    const [draft] = selectAllDrafts(store.getState());
    expect(draft?.listingUrl).toBe(LINK);
    expect(draft?.source).toBe('pasted_url');
    expect(getPathname()).toBe(`/intake/review/${draft?.id}`);
  });

  it('waits until AI availability is known before reading the link', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(LISTING_PAGE_HTML, { headers: { 'content-type': 'text/html' } }),
      );
    const { store } = await renderIntake(`/intake/new?url=${encodeURIComponent(LINK)}`, {
      ai: null,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(fakeModel.prompts).toHaveLength(0);

    await act(async () => {
      store.dispatch(aiAvailabilityChecked(AI_AVAILABLE));
    });
    expect(await screen.findByText('Review draft')).toBeOnTheScreen();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fakeModel.prompts).toHaveLength(1);
  });

  it('waits for the user when AI turns out to be unavailable', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    const { store } = await renderIntake(`/intake/new?url=${encodeURIComponent(LINK)}`, {
      ai: null,
    });

    await act(async () => {
      store.dispatch(aiAvailabilityChecked({ status: 'unavailable', reason: 'os_too_old' }));
    });
    expect(screen.getByRole('button', { name: 'Continue manually' })).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fakeModel.prompts).toHaveLength(0);
  });

  it('opens a LinkedIn link in paste mode without loading it, and waits', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    await renderIntake(`/intake/new?url=${encodeURIComponent(LINKEDIN_LINK)}`);

    expect(screen.getByText(LINKEDIN_NOTICE)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Paste text' })).toBeSelected();
    expect(
      screen.getByText(`The link ${LINKEDIN_CANONICAL} will be saved with this listing.`),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Create draft' })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fakeModel.prompts).toHaveLength(0);
  });

  it.each([['javascript:alert(1)'], ['file:///etc/hosts'], ['']])(
    'ignores url=%p and opens an empty link field',
    async (param) => {
      const fetchMock = jest.spyOn(globalThis, 'fetch');
      await renderIntake(`/intake/new?url=${encodeURIComponent(param)}`);
      expect(screen.getByLabelText('Job link')).toHaveDisplayValue('');
      expect(fetchMock).not.toHaveBeenCalled();
      expect(fakeModel.prompts).toHaveLength(0);
    },
  );
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

    expect(await screen.findByText('Couldn’t connect')).toBeOnTheScreen();
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
