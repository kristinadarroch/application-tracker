import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import {
  Button,
  SpotlightCard,
  FloatingTabBar,
  ProgressSteps,
  ProposalCard,
  StageStep,
  Screen,
  Text,
  ThemeProvider,
} from '@/design-system';

function renderThemed(ui: ReactElement) {
  return render(<ThemeProvider preference="light">{ui}</ThemeProvider>);
}

describe('StageStep', () => {
  it('is a button named by its label that exposes the selected state', async () => {
    const onPress = jest.fn();
    await renderThemed(
      <>
        <StageStep stage="applied" state="passed" accent={0} label="Applied" onPress={onPress} />
        <StageStep
          stage="interviewing"
          state="current"
          accent={0}
          label="Interviewing"
          accessibilityLabel="Interviewing, current"
          tag="CURRENT"
          selected
          onPress={jest.fn()}
        />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Applied' })).not.toBeSelected();
    expect(screen.getByRole('button', { name: 'Interviewing, current' })).toBeSelected();
    await fireEvent.press(screen.getByRole('button', { name: 'Applied' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is not a button without onPress and keeps its children reachable', async () => {
    const onDone = jest.fn();
    await renderThemed(
      <StageStep stage="offer" state="future" accent={1} label="Offer" meta="NEXT STAGE" last>
        <Button label="Add Next Step" onPress={onDone} />
      </StageStep>,
    );
    expect(screen.getByText('Offer')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Offer' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Add Next Step' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('ProposalCard', () => {
  it('announces "Proposal, not saved" and keeps controls inside reachable', async () => {
    const onAccept = jest.fn();
    await renderThemed(
      <ProposalCard eyebrow="PROPOSED · FROM EMAIL" onDevice>
        <Button label="Accept" onPress={onAccept} />
      </ProposalCard>,
    );
    expect(
      screen.getByLabelText('Proposal, not saved: PROPOSED · FROM EMAIL, on-device'),
    ).toBeOnTheScreen();
    expect(screen.getByText('On-device')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Accept' }));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('does not claim on-device when the result was not produced on this device', async () => {
    await renderThemed(
      <ProposalCard eyebrow="PROPOSED · REPLAY">
        <Text>Body</Text>
      </ProposalCard>,
    );
    expect(screen.getByLabelText('Proposal, not saved: PROPOSED · REPLAY')).toBeOnTheScreen();
    expect(screen.queryByText('On-device')).toBeNull();
  });
});

describe('ProgressSteps', () => {
  it('announces how many steps are practiced', async () => {
    await renderThemed(<ProgressSteps total={20} done={6} />);
    expect(screen.getByLabelText('6 of 20 practiced')).toBeOnTheScreen();
  });

  it('clamps done to the total', async () => {
    await renderThemed(<ProgressSteps total={3} done={5} />);
    expect(screen.getByLabelText('3 of 3 practiced')).toBeOnTheScreen();
  });
});

describe('FloatingTabBar', () => {
  it('exposes tabs with the tab role and selected state, plus the action button', async () => {
    const onInbox = jest.fn();
    const onAdd = jest.fn();
    await renderThemed(
      <FloatingTabBar
        tabs={[
          {
            key: 'pipeline',
            label: 'Pipeline',
            icon: 'git-commit-outline',
            focused: true,
            onPress: jest.fn(),
          },
          {
            key: 'inbox',
            label: 'Inbox',
            icon: 'mail-outline',
            focused: false,
            onPress: onInbox,
            badge: '1',
          },
          {
            key: 'prep',
            label: 'Prep',
            icon: 'reader-outline',
            focused: false,
            onPress: jest.fn(),
          },
        ]}
        action={{ icon: 'add', accessibilityLabel: 'Add application', onPress: onAdd }}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Pipeline' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Inbox' })).not.toBeSelected();
    expect(screen.getByText('Prep')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('tab', { name: 'Inbox' }));
    expect(onInbox).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Add application' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});

describe('SpotlightCard', () => {
  it('shows the urgent label and wires the action and done buttons', async () => {
    const onAction = jest.fn();
    const onDone = jest.fn();
    await renderThemed(
      <SpotlightCard
        eyebrow="UP NEXT"
        count="1 TODAY"
        accent={{ index: 0, letter: 'A' }}
        title="Book the onsite"
        subtitle="Acme Health · Senior RN Engineer"
        urgentLabel="Due tomorrow"
        action={{ label: 'View', onPress: onAction }}
        onDone={onDone}
      />,
    );
    expect(screen.getByText('Due tomorrow')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'View' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Mark Book the onsite done' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('Screen panel header', () => {
  it('keeps the header role on the title and the Back button on the panel', async () => {
    const onBack = jest.fn();
    await renderThemed(
      <Screen header="panel" eyebrow="FRI 6 NOV" title="Mock interview" onBack={onBack}>
        <Text>Body</Text>
      </Screen>,
    );
    expect(screen.getByRole('header', { name: 'Mock interview' })).toBeOnTheScreen();
    expect(screen.getByText('FRI 6 NOV')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
