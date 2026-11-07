import { act, fireEvent, screen } from 'expo-router/testing-library';

import { selectAllApplications } from '@/features/applications/model';
import { DraftIdSchema } from '@/lib/ids';

import { draftRemoved, selectAllDrafts } from '../draftsSlice';
import { draftsState, makeDraft } from '../testing/fixtures';
import { renderIntake } from '../testing/renderIntake';

const draft = makeDraft({ listingUrl: 'https://acme.example/jobs/42' });
const REVIEW_URL = `/intake/review/${draft.id}`;

async function press(name: string) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

describe('Review a draft (INT-4)', () => {
  it('shows every extracted field as editable, and nothing is created before Confirm', async () => {
    const { store } = await renderIntake(REVIEW_URL, {
      preloadedState: { drafts: draftsState(draft) },
    });

    for (const [label, value] of [
      ['Company', 'Acme Health'],
      ['Role', 'Senior React Native Engineer'],
      ['Location', 'Austin, TX'],
      ['Salary', '$150,000 - $180,000'],
      ['Listing link', 'https://acme.example/jobs/42'],
      ['Requirements', '5+ years React Native\nTypeScript\nRedux Toolkit'],
      ['Notes', ''],
    ] as const) {
      expect(screen.getByLabelText(label)).toHaveDisplayValue(value);
    }
    expect(selectAllApplications(store.getState())).toHaveLength(0);
    // Unconfirmed AI output is marked as a proposal, not a saved application.
    expect(screen.getByLabelText(/^Proposal, not saved/)).toBeOnTheScreen();
  });

  it('creates the application from my edits on Confirm and removes the draft', async () => {
    const { store, getPathname } = await renderIntake(REVIEW_URL, {
      preloadedState: { drafts: draftsState(draft) },
    });
    await fireEvent.changeText(screen.getByLabelText('Role'), 'Staff React Native Engineer');
    await fireEvent.changeText(screen.getByLabelText('Notes'), 'Referred by Sam');
    await press('Confirm');

    const [application] = selectAllApplications(store.getState());
    expect(application).toMatchObject({
      company: 'Acme Health',
      role: 'Staff React Native Engineer',
      location: 'Austin, TX',
      listingUrl: 'https://acme.example/jobs/42',
      stage: 'saved',
      notes: 'Referred by Sam',
      requirements: ['5+ years React Native', 'TypeScript', 'Redux Toolkit'],
    });
    expect(selectAllDrafts(store.getState())).toHaveLength(0);
    expect(getPathname()).toBe(`/application/${application?.id}`);
  });

  it('shows field errors and saves nothing when the company is blank', async () => {
    const { store } = await renderIntake(REVIEW_URL, {
      preloadedState: { drafts: draftsState(draft) },
    });
    await fireEvent.changeText(screen.getByLabelText('Company'), '  ');
    await press('Confirm');

    expect(screen.getByText('Add the company')).toBeOnTheScreen();
    expect(selectAllApplications(store.getState())).toHaveLength(0);
    expect(selectAllDrafts(store.getState())).toHaveLength(1);
  });

  it('removes the draft on Discard and creates nothing', async () => {
    const { store, getPathname } = await renderIntake(REVIEW_URL, {
      preloadedState: { drafts: draftsState(draft) },
    });
    await press('Discard');

    expect(selectAllDrafts(store.getState())).toHaveLength(0);
    expect(selectAllApplications(store.getState())).toHaveLength(0);
    expect(getPathname()).toBe('/');
  });

  it('keeps edits on the draft when I leave a field (INT-6)', async () => {
    const { store } = await renderIntake(REVIEW_URL, {
      preloadedState: { drafts: draftsState(draft) },
    });
    const notes = screen.getByLabelText('Notes');
    await fireEvent.changeText(notes, 'Ask about on-call');
    await fireEvent(notes, 'blur');

    expect(selectAllDrafts(store.getState())[0]?.notes).toBe('Ask about on-call');
    expect(selectAllApplications(store.getState())).toHaveLength(0);
  });

  it('says only the first part was read when the listing was trimmed (INT-5)', async () => {
    await renderIntake(REVIEW_URL, {
      preloadedState: { drafts: draftsState({ ...draft, trimmed: true }) },
    });
    expect(screen.getByText('Only the first part of this listing was read')).toBeOnTheScreen();
  });

  it('shows not found for a draft that no longer exists', async () => {
    await renderIntake('/intake/review/draft_gone');
    expect(screen.getByText('Not found')).toBeOnTheScreen();
    expect(screen.getByText('This draft no longer exists.')).toBeOnTheScreen();
  });

  it('keeps the draft on screen when it is removed while open, instead of flashing Not found', async () => {
    const { store } = await renderIntake(REVIEW_URL, {
      preloadedState: { drafts: draftsState(draft) },
    });
    // What Confirm and Discard do just before the screen animates away.
    await act(() => store.dispatch(draftRemoved(draft.id)));
    expect(screen.queryByText('Not found')).toBeNull();
    expect(screen.getByLabelText('Company')).toHaveDisplayValue('Acme Health');
  });
});

describe('DraftsBanner on the Pipeline (INT-6)', () => {
  it('renders nothing without drafts', async () => {
    await renderIntake('/');
    expect(screen.getByText('Pipeline')).toBeOnTheScreen();
    expect(screen.queryByText(/to review/)).toBeNull();
  });

  it('says "1 draft to review" for an unfinished draft', async () => {
    await renderIntake('/', { preloadedState: { drafts: draftsState(draft) } });
    expect(screen.getByText('1 draft to review')).toBeOnTheScreen();
  });

  it('counts drafts and opens the newest one', async () => {
    const older = makeDraft({
      id: DraftIdSchema.parse('draft_old'),
      createdAt: '2026-11-01T09:00:00.000Z',
    });
    const { getPathname } = await renderIntake('/', {
      preloadedState: { drafts: draftsState(older, draft) },
    });
    expect(screen.getByText('2 drafts to review')).toBeOnTheScreen();
    expect(
      screen.getByText('Newest: Senior React Native Engineer at Acme Health'),
    ).toBeOnTheScreen();

    await press('Review draft');
    expect(getPathname()).toBe(`/intake/review/${draft.id}`);
  });
});
