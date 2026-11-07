import { act, fireEvent, screen, within } from 'expo-router/testing-library';
import { Alert, Linking, type AlertButton } from 'react-native';

import { addDays, toIsoDate } from '@/lib/dates';
import { NextStepIdSchema } from '@/lib/ids';

import { selectAllApplications } from '../selectors';
import { applicationsState, makeApplication, makeNextStep } from '../testing/fixtures';
import { renderApp } from '@/test/renderApp';

const daysFromNow = (days: number) => toIsoDate(addDays(new Date(), days));

const acme = makeApplication({
  salary: '$150k',
  listingUrl: 'https://acme.com/jobs/1',
  notes: 'Referred by Sam.',
  requirements: ['TypeScript'],
});

async function openAcmeFromPipeline(application = acme) {
  const rendered = await renderApp('/', {
    preloadedState: { applications: applicationsState(application) },
  });
  await fireEvent.press(screen.getByRole('button', { name: /^Acme Health,/ }));
  return rendered;
}

afterEach(() => jest.restoreAllMocks());

describe('Application detail (PIPE-4)', () => {
  it('shows every field and opens the listing link in the browser', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await renderApp('/application/app_acme', {
      preloadedState: { applications: applicationsState(acme) },
    });
    for (const text of [
      'Acme Health',
      'Senior React Native Engineer',
      '$150k',
      'https://acme.com/jobs/1',
      'Referred by Sam.',
      '• TypeScript',
      'No open Next Steps.',
    ]) {
      expect(screen.getByText(text)).toBeOnTheScreen();
    }
    // The location heads the identity block and repeats under Details.
    expect(screen.getAllByText('Austin, TX')).toHaveLength(2);
    expect(screen.getByLabelText('Stage: Saved')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Open listing' }));
    expect(openURL).toHaveBeenCalledWith('https://acme.com/jobs/1');
  });

  it('links to prep questions and the mock interview', async () => {
    const { getPathname } = await renderApp('/application/app_acme', {
      preloadedState: { applications: applicationsState(acme) },
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Mock interview' }));
    expect(getPathname()).toBe('/prep/app_acme/mock');
  });

  it('shows not found for an unknown application', async () => {
    await renderApp('/application/app_missing');
    expect(screen.getByText('Not found')).toBeOnTheScreen();
  });
});

describe('Change stage (PIPE-3)', () => {
  it('moves the card to the new group immediately', async () => {
    await openAcmeFromPipeline();
    await fireEvent.press(screen.getByRole('button', { name: 'Interviewing' }));
    expect(screen.getByRole('button', { name: 'Interviewing' })).toBeSelected();

    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('Saved, 0 applications')).toBeOnTheScreen();
    expect(screen.getByLabelText('Interviewing, 1 application')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Acme Health,/ })).toHaveAccessibleName(
      /Stage: Interviewing/,
    );
  });

  it('closes the application as Rejected, and the stage steps reopen it', async () => {
    const { store } = await openAcmeFromPipeline();
    await fireEvent.press(screen.getByRole('button', { name: 'Rejected' }));
    expect(selectAllApplications(store.getState())[0]?.stage).toBe('rejected');
    expect(screen.getByLabelText('Stage: Rejected')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Rejected' })).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Applied' }));
    expect(selectAllApplications(store.getState())[0]?.stage).toBe('applied');
    expect(screen.getByRole('button', { name: 'Applied' })).toBeSelected();
  });
});

describe('Next Steps (PIPE-6)', () => {
  it('validates the title and due date', async () => {
    await openAcmeFromPipeline();
    await fireEvent.changeText(screen.getByLabelText('Due date'), '2026-02-31');
    await fireEvent.press(screen.getByRole('button', { name: 'Add Next Step' }));
    expect(screen.getByText('Add a title')).toBeOnTheScreen();
    expect(screen.getByText('Enter a real date')).toBeOnTheScreen();
  });

  it('lists open steps sorted by due date', async () => {
    await openAcmeFromPipeline(
      makeApplication({
        nextSteps: [
          makeNextStep({
            id: NextStepIdSchema.parse('s1'),
            title: 'Later',
            dueDate: daysFromNow(9),
          }),
          makeNextStep({
            id: NextStepIdSchema.parse('s2'),
            title: 'Sooner',
            dueDate: daysFromNow(4),
          }),
        ],
      }),
    );
    await fireEvent.changeText(screen.getByLabelText('Next Step'), 'Soonest');
    await fireEvent.press(screen.getByRole('button', { name: 'Today' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add Next Step' }));

    const toggles = screen.getAllByRole('button', { name: /^Mark “.+” done$/ });
    expect(toggles.map((toggle) => toggle.props.accessibilityLabel)).toEqual([
      'Mark “Soonest” done',
      'Mark “Sooner” done',
      'Mark “Later” done',
    ]);
    expect(screen.getByText('Due today')).toBeOnTheScreen();
  });

  it('flags the pipeline card when a step is due tomorrow, and clears it once done', async () => {
    await openAcmeFromPipeline();
    await fireEvent.changeText(screen.getByLabelText('Next Step'), 'Book the onsite');
    await fireEvent.press(screen.getByRole('button', { name: 'Tomorrow' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add Next Step' }));
    expect(screen.getByText('Due tomorrow')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    const card = screen.getByRole('button', { name: /^Acme Health,/ });
    expect(within(card).getByText('Due tomorrow')).toBeOnTheScreen();

    await fireEvent.press(card);
    await fireEvent.press(screen.getByRole('button', { name: 'Mark “Book the onsite” done' }));
    expect(screen.getByText('Completed')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Mark “Book the onsite” not done' }),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(
      within(screen.getByRole('button', { name: /^Acme Health,/ })).queryByText('Due tomorrow'),
    ).not.toBeOnTheScreen();
  });

  it('deletes a step', async () => {
    await openAcmeFromPipeline(makeApplication({ nextSteps: [makeNextStep()] }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Delete “Book the onsite interview”' }),
    );
    expect(screen.getByText('No open Next Steps.')).toBeOnTheScreen();
  });
});

describe('Delete an application (PIPE-5)', () => {
  function pressAlertButton(text: string) {
    const alert = jest.mocked(Alert.alert);
    const buttons: AlertButton[] = alert.mock.calls.at(-1)?.[2] ?? [];
    buttons.find((button) => button.text === text)?.onPress?.();
  }

  it('asks for confirmation and keeps the application when cancelled', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { store } = await openAcmeFromPipeline();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete application' }));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete application?',
      expect.stringContaining('Next Steps, prep questions, and mock interview sessions'),
      expect.any(Array),
    );
    await act(async () => pressAlertButton('Cancel'));
    expect(selectAllApplications(store.getState())).toHaveLength(1);
  });

  it('removes the application after confirming and returns to the pipeline', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { store, getPathname } = await openAcmeFromPipeline();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete application' }));
    expect(selectAllApplications(store.getState())).toHaveLength(1);

    await act(async () => pressAlertButton('Delete'));
    expect(selectAllApplications(store.getState())).toEqual([]);
    expect(getPathname()).toBe('/');
  });
});
