import { fireEvent, screen, within } from 'expo-router/testing-library';

import { addDays, toIsoDate } from '@/lib/dates';
import { ApplicationIdSchema, NextStepIdSchema } from '@/lib/ids';

import { applicationsState, makeApplication, makeNextStep, prepState } from '../testing/fixtures';
import { renderApp } from '@/test/renderApp';

const daysFromNow = (days: number) => toIsoDate(addDays(new Date(), days));

describe('Pipeline (PIPE-1)', () => {
  it('shows an empty state led by Add from a link, with Add application as the manual path', async () => {
    const { getPathname } = await renderApp('/');
    expect(screen.getByText('No applications yet')).toBeOnTheScreen();
    expect(
      screen.getByText('Add a job from its link and review what AI fills in, or add it by hand.'),
    ).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: 'Add application' }).length).toBeGreaterThan(0);

    const linkButtons = screen.getAllByRole('button', { name: 'Add from a link' });
    await fireEvent.press(linkButtons[linkButtons.length - 1]!);
    expect(getPathname()).toBe('/intake/new');
  });

  it('groups applications in stage order with a count per stage, including empty stages', async () => {
    await renderApp('/', {
      preloadedState: {
        applications: applicationsState(
          makeApplication({
            id: ApplicationIdSchema.parse('a1'),
            company: 'Acme Health',
            stage: 'interviewing',
          }),
          makeApplication({
            id: ApplicationIdSchema.parse('a2'),
            company: 'Globex',
            stage: 'applied',
          }),
          makeApplication({
            id: ApplicationIdSchema.parse('a3'),
            company: 'Northwind Labs',
            stage: 'applied',
          }),
        ),
      },
    });
    const headers = screen.getAllByLabelText(/^\w+, \d+ applications?$/);
    expect(headers.map((header) => header.props.accessibilityLabel)).toEqual([
      'Saved, 0 applications',
      'Applied, 2 applications',
      'Interviewing, 1 application',
      'Offer, 0 applications',
      'Rejected, 0 applications',
      'Withdrawn, 0 applications',
    ]);
  });

  it('shows company, role, location, and stage on each application row', async () => {
    await renderApp('/', {
      preloadedState: { applications: applicationsState(makeApplication({ stage: 'applied' })) },
    });
    const row = screen.getByRole('button', { name: /^Acme Health,/ });
    expect(within(row).getByText('Acme Health')).toBeOnTheScreen();
    expect(within(row).getByText('Senior React Native Engineer')).toBeOnTheScreen();
    expect(within(row).getByText('Austin, TX')).toBeOnTheScreen();
    expect(row).toHaveAccessibleName(
      'Acme Health, Senior React Native Engineer, Austin, TX, Stage: Applied',
    );
  });

  it('opens the manual add form from the panel header', async () => {
    const { getPathname } = await renderApp('/');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Add application' })[0]!);
    expect(getPathname()).toBe('/application/new');
  });

  it('adds from a link with the tab bar action button', async () => {
    const { getPathname } = await renderApp('/', {
      preloadedState: { applications: applicationsState(makeApplication()) },
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Add from a link' }));
    expect(getPathname()).toBe('/intake/new');
  });

  it('opens the detail screen from a card', async () => {
    const { getPathname } = await renderApp('/', {
      preloadedState: { applications: applicationsState(makeApplication()) },
    });
    await fireEvent.press(screen.getByRole('button', { name: /^Acme Health,/ }));
    expect(getPathname()).toBe('/application/app_acme');
  });
});

describe('Urgent badge (PIPE-6)', () => {
  it('shows a warning badge for urgent open Next Steps only', async () => {
    await renderApp('/', {
      preloadedState: {
        applications: applicationsState(
          makeApplication({
            id: ApplicationIdSchema.parse('urgent'),
            company: 'Acme Health',
            nextSteps: [makeNextStep({ dueDate: daysFromNow(1) })],
          }),
          makeApplication({
            id: ApplicationIdSchema.parse('overdue'),
            company: 'Globex',
            nextSteps: [makeNextStep({ dueDate: daysFromNow(-2) })],
          }),
          makeApplication({
            id: ApplicationIdSchema.parse('calm'),
            company: 'Northwind Labs',
            nextSteps: [
              makeNextStep({ dueDate: daysFromNow(10) }),
              makeNextStep({
                id: NextStepIdSchema.parse('done'),
                dueDate: daysFromNow(0),
                done: true,
              }),
            ],
          }),
        ),
      },
    });
    expect(
      within(screen.getByRole('button', { name: /^Acme Health,/ })).getByText('Due tomorrow'),
    ).toBeOnTheScreen();
    expect(
      within(screen.getByRole('button', { name: /^Globex,/ })).getByText(/^Overdue · /),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Northwind Labs,/ })).not.toHaveAccessibleName(
      /Urgent/,
    );
  });
});

describe('Up next (PIPE-6)', () => {
  it('opens the soonest open Next Step across all applications', async () => {
    const { getPathname } = await renderApp('/', {
      preloadedState: {
        applications: applicationsState(
          makeApplication({
            id: ApplicationIdSchema.parse('later'),
            company: 'Globex',
            nextSteps: [makeNextStep({ title: 'Send references', dueDate: daysFromNow(5) })],
          }),
          makeApplication({
            id: ApplicationIdSchema.parse('soonest'),
            company: 'Acme Health',
            nextSteps: [makeNextStep({ title: 'Book the onsite', dueDate: daysFromNow(1) })],
          }),
        ),
      },
    });
    expect(screen.getByText('Book the onsite')).toBeOnTheScreen();
    expect(screen.queryByText('Send references')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'View' }));
    expect(getPathname()).toBe('/application/soonest');
  });
});

describe('Applications card', () => {
  it('counts active and closed applications and marks closed rows', async () => {
    await renderApp('/', {
      preloadedState: {
        applications: applicationsState(
          makeApplication({ id: ApplicationIdSchema.parse('a1'), stage: 'applied' }),
          makeApplication({
            id: ApplicationIdSchema.parse('a2'),
            company: 'Globex',
            stage: 'rejected',
          }),
          makeApplication({
            id: ApplicationIdSchema.parse('a3'),
            company: 'Northwind Labs',
            stage: 'withdrawn',
          }),
        ),
      },
    });
    expect(screen.getByText('Your applications')).toBeOnTheScreen();
    expect(screen.getByText('1 active · 2 closed')).toBeOnTheScreen();
    expect(
      within(screen.getByRole('button', { name: /^Globex,/ })).getByText('Closed: rejected'),
    ).toBeOnTheScreen();
    expect(
      within(screen.getByRole('button', { name: /^Northwind Labs,/ })).getByText(
        'Closed: withdrawn',
      ),
    ).toBeOnTheScreen();
  });

  it('shows prep progress on Interviewing rows only', async () => {
    const acmeId = ApplicationIdSchema.parse('app_acme');
    await renderApp('/', {
      preloadedState: {
        applications: applicationsState(
          makeApplication({
            id: acmeId,
            stage: 'interviewing',
            nextSteps: [makeNextStep({ dueDate: daysFromNow(1) })],
          }),
          makeApplication({
            id: ApplicationIdSchema.parse('globex'),
            company: 'Globex',
            stage: 'interviewing',
          }),
          makeApplication({
            id: ApplicationIdSchema.parse('northwind'),
            company: 'Northwind Labs',
            stage: 'applied',
          }),
        ),
        prep: prepState({ [acmeId]: { practiced: 4, total: 10, mockCount: 0 } }),
      },
    });
    const acme = screen.getByRole('button', { name: /^Acme Health,/ });
    expect(within(acme).getByText('4 of 10 practiced')).toBeOnTheScreen();
    expect(acme).toHaveAccessibleName(
      'Acme Health, Senior React Native Engineer, Austin, TX, Stage: Interviewing, Urgent: Due tomorrow, Prep: 4 of 10 questions practiced',
    );
    const globex = screen.getByRole('button', { name: /^Globex,/ });
    expect(within(globex).getByText('Prep not started')).toBeOnTheScreen();
    expect(globex).toHaveAccessibleName(
      'Globex, Senior React Native Engineer, Austin, TX, Stage: Interviewing, Prep: not started',
    );
    expect(screen.getByRole('button', { name: /^Northwind Labs,/ })).toHaveAccessibleName(
      'Northwind Labs, Senior React Native Engineer, Austin, TX, Stage: Applied',
    );
  });

  it('adds mock interviews to the row prep line and label', async () => {
    const acmeId = ApplicationIdSchema.parse('app_acme');
    await renderApp('/', {
      preloadedState: {
        applications: applicationsState(makeApplication({ id: acmeId, stage: 'interviewing' })),
        prep: prepState({ [acmeId]: { practiced: 4, total: 10, mockCount: 1 } }),
      },
    });
    const acme = screen.getByRole('button', { name: /^Acme Health,/ });
    expect(within(acme).getByText('4 of 10 practiced · 1 mock')).toBeOnTheScreen();
    expect(acme).toHaveAccessibleName(
      'Acme Health, Senior React Native Engineer, Austin, TX, Stage: Interviewing, Prep: 4 of 10 questions practiced, 1 mock interview',
    );
  });
});

describe('Next interview card', () => {
  const acmeId = ApplicationIdSchema.parse('app_acme');
  const interviewingState = {
    applications: applicationsState(
      makeApplication({
        id: acmeId,
        stage: 'interviewing',
        nextSteps: [makeNextStep({ dueDate: daysFromNow(2) })],
      }),
      makeApplication({
        id: ApplicationIdSchema.parse('globex'),
        company: 'Globex',
        stage: 'interviewing',
      }),
    ),
    prep: prepState({ [acmeId]: { practiced: 4, total: 10, mockCount: 1 } }),
  };

  it('leads with the next interview and its prep progress', async () => {
    await renderApp('/', { preloadedState: interviewingState });
    expect(screen.getByText('Next interview')).toBeOnTheScreen();
    expect(screen.getByText('+1 more')).toBeOnTheScreen();
    expect(screen.getByText('4 of 10 questions practiced · 1 mock interview')).toBeOnTheScreen();
  });

  it('opens prep questions for the application', async () => {
    const { getPathname } = await renderApp('/', { preloadedState: interviewingState });
    await fireEvent.press(screen.getByRole('button', { name: 'Practice questions' }));
    expect(getPathname()).toBe('/prep/app_acme');
  });

  it('opens a mock interview for the application', async () => {
    const { getPathname } = await renderApp('/', { preloadedState: interviewingState });
    await fireEvent.press(screen.getByRole('button', { name: 'Mock interview' }));
    expect(getPathname()).toBe('/prep/app_acme/mock');
  });

  it('says prep has not started when there are no questions or mock interviews', async () => {
    await renderApp('/', {
      preloadedState: {
        applications: applicationsState(makeApplication({ stage: 'interviewing' })),
      },
    });
    // Once on the card, once on the row.
    expect(screen.getAllByText('Prep not started')).toHaveLength(2);
    expect(screen.queryByText(/more$/)).not.toBeOnTheScreen();
  });

  it('explains how prep starts when nothing is Interviewing, with no actions', async () => {
    await renderApp('/', {
      preloadedState: { applications: applicationsState(makeApplication({ stage: 'applied' })) },
    });
    expect(screen.getByText('Interview prep')).toBeOnTheScreen();
    expect(screen.getByText('No interviews yet')).toBeOnTheScreen();
    expect(
      screen.getByText('Move an application to Interviewing and its prep questions show up here.'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Practice questions' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Mock interview' })).not.toBeOnTheScreen();
  });
});
