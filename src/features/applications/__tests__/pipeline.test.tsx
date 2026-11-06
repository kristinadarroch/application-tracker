import { fireEvent, screen, within } from 'expo-router/testing-library';

import { addDays, toIsoDate } from '@/lib/dates';
import { ApplicationIdSchema, NextStepIdSchema } from '@/lib/ids';

import { applicationsState, makeApplication, makeNextStep } from '../testing/fixtures';
import { renderApp } from '@/test/renderApp';

const daysFromNow = (days: number) => toIsoDate(addDays(new Date(), days));

describe('Pipeline (PIPE-1)', () => {
  it('shows an empty state led by Add from a link, with Add application as the manual path', async () => {
    const { getPathname } = await renderApp('/');
    expect(screen.getByText('No applications yet')).toBeOnTheScreen();
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

  it('shows company, role, location, and stage on each card', async () => {
    await renderApp('/', {
      preloadedState: { applications: applicationsState(makeApplication({ stage: 'applied' })) },
    });
    const card = screen.getByRole('button', { name: /^Acme Health,/ });
    expect(within(card).getByText('Acme Health')).toBeOnTheScreen();
    expect(within(card).getByText('Senior React Native Engineer')).toBeOnTheScreen();
    expect(within(card).getByText('Austin, TX')).toBeOnTheScreen();
    expect(within(card).getByLabelText('Stage: Applied')).toBeOnTheScreen();
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
