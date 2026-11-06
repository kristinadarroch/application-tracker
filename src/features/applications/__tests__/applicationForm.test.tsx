import { fireEvent, screen } from 'expo-router/testing-library';

import { selectAllApplications } from '../selectors';
import { applicationsState, makeApplication } from '../testing/fixtures';
import { renderApp } from '../testing/renderApp';

describe('Add an application (PIPE-2)', () => {
  it('shows an error on each missing required field and saves nothing', async () => {
    const { store, getPathname } = await renderApp('/application/new');
    await fireEvent.press(screen.getByRole('button', { name: 'Save application' }));

    expect(screen.getByText('Add the company')).toBeOnTheScreen();
    expect(screen.getByText('Add the role')).toBeOnTheScreen();
    expect(selectAllApplications(store.getState())).toEqual([]);
    expect(getPathname()).toBe('/application/new');
  });

  it('rejects a listing link that is not an http(s) URL', async () => {
    const { store } = await renderApp('/application/new');
    await fireEvent.changeText(screen.getByLabelText('Company'), 'Acme Health');
    await fireEvent.changeText(screen.getByLabelText('Role'), 'Engineer');
    await fireEvent.changeText(screen.getByLabelText('Listing link'), 'ftp://acme.com/job');
    await fireEvent.press(screen.getByRole('button', { name: 'Save application' }));

    expect(screen.getByText('Enter a link that starts with http:// or https://')).toBeOnTheScreen();
    expect(selectAllApplications(store.getState())).toEqual([]);
  });

  it('saves trimmed fields in the picked stage and opens the new application', async () => {
    const { store, getPathname } = await renderApp('/application/new');
    await fireEvent.changeText(screen.getByLabelText('Company'), '  Acme Health ');
    await fireEvent.changeText(screen.getByLabelText('Role'), ' Senior Engineer  ');
    await fireEvent.changeText(screen.getByLabelText('Listing link'), ' https://acme.com/jobs/1 ');
    await fireEvent.changeText(screen.getByLabelText('Requirements'), 'TypeScript, Redux\nJest');
    await fireEvent.press(screen.getByRole('button', { name: 'Applied' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save application' }));

    const [saved] = selectAllApplications(store.getState());
    expect(saved).toMatchObject({
      company: 'Acme Health',
      role: 'Senior Engineer',
      listingUrl: 'https://acme.com/jobs/1',
      stage: 'applied',
      requirements: ['TypeScript', 'Redux', 'Jest'],
    });
    expect(getPathname()).toBe(`/application/${saved!.id}`);
    expect(screen.getByText('Senior Engineer')).toBeOnTheScreen();
  });

  it('accepts prefill params and explains why AI was not used (UX-7)', async () => {
    await renderApp(
      '/application/new?company=Globex&notes=Pasted%20listing%20text&stage=applied&aiNote=Apple%20Intelligence%20is%20off',
    );
    expect(screen.getByDisplayValue('Globex')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Pasted listing text')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Applied' })).toBeSelected();
    expect(screen.getByText('Apple Intelligence is off')).toBeOnTheScreen();
  });
});

describe('Edit an application (PIPE-4)', () => {
  it('saves changes that then show on the detail screen and in the pipeline', async () => {
    const { store, getPathname } = await renderApp('/', {
      preloadedState: { applications: applicationsState(makeApplication()) },
    });
    await fireEvent.press(screen.getByRole('button', { name: /^Acme Health,/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Edit application' }));
    expect(screen.getByDisplayValue('Senior React Native Engineer')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Role'), 'Staff Engineer');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(getPathname()).toBe('/application/app_acme');
    expect(screen.getByText('Staff Engineer')).toBeOnTheScreen();
    expect(selectAllApplications(store.getState())[0]?.role).toBe('Staff Engineer');

    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: /^Acme Health, Staff Engineer/ })).toBeOnTheScreen();
  });

  it('shows not found for an unknown application', async () => {
    await renderApp('/application/app_missing/edit');
    expect(screen.getByText('This application no longer exists.')).toBeOnTheScreen();
  });
});
