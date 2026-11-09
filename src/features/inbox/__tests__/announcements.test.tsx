import { AccessibilityInfo } from 'react-native';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '@/design-system';
import { ApplicationIdSchema, MessageIdSchema } from '@/lib/ids';

import { EmailUpdatePanel } from '../components/EmailUpdatePanel';
import { MessageRow } from '../components/MessageRow';
import { TriageResultPanel } from '../components/TriageResultPanel';
import type { EmailUpdate, InboxMessage, TriageResult, TriageState } from '../schema';

function themed(ui: ReactElement) {
  return <ThemeProvider preference="light">{ui}</ThemeProvider>;
}

const applicationId = ApplicationIdSchema.parse('app-1');
const update: EmailUpdate = {
  messageId: MessageIdSchema.parse('msg-1'),
  applicationId,
  subject: 'Next steps',
  previousStage: 'applied',
  newStage: 'interviewing',
  replayed: false,
  appliedAt: '2026-11-09T10:00:00Z',
};
const result: TriageResult = { category: 'interview_invite', applicationId, confidence: 'high' };
const message: InboxMessage = {
  id: MessageIdSchema.parse('msg-1'),
  from: 'recruiter@acme.example',
  subject: 'Next steps',
  receivedAt: '2026-11-09T10:00:00Z',
  bodyText: 'Let’s talk.',
  origin: 'mock',
};

let announce: jest.SpyInstance;
beforeEach(() => {
  announce = jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockImplementation(() => undefined)
    // Jest reuses the restored spy, so earlier tests' calls would carry over.
    .mockClear();
});
afterEach(() => jest.restoreAllMocks());

describe('EmailUpdatePanel', () => {
  it('announces the applied change once, then "Update undone" once after Undo', async () => {
    const { rerender } = await render(
      themed(<EmailUpdatePanel update={update} canUndo onUndo={jest.fn()} />),
    );
    expect(announce.mock.calls).toEqual([['Moved to Interviewing']]);

    const undone = { ...update, undoneAt: '2026-11-09T10:05:00Z' };
    await rerender(themed(<EmailUpdatePanel update={undone} canUndo={false} onUndo={jest.fn()} />));
    await rerender(themed(<EmailUpdatePanel update={undone} canUndo={false} onUndo={jest.fn()} />));
    expect(announce.mock.calls).toEqual([['Moved to Interviewing'], ['Update undone']]);
  });

  it('stays quiet when it opens on an update that was already undone', async () => {
    await render(
      themed(
        <EmailUpdatePanel
          update={{ ...update, undoneAt: '2026-11-09T10:05:00Z' }}
          canUndo={false}
          onUndo={jest.fn()}
        />,
      ),
    );
    expect(announce).not.toHaveBeenCalled();
  });
});

describe('TriageResultPanel', () => {
  it('announces the result, then the dismissal', async () => {
    const panel = (decision: 'open' | 'dismissed') =>
      themed(
        <TriageResultPanel
          result={{ ...result, proposedNextStep: undefined, category: 'rejection' }}
          replayed={false}
          decision={decision}
          applications={[{ id: applicationId, company: 'Acme', role: 'Engineer' }]}
          stages={{ [applicationId]: 'interviewing' }}
          onAccept={jest.fn()}
          onDismiss={jest.fn()}
        />,
      );
    const { rerender } = await render(panel('open'));
    expect(announce.mock.calls).toEqual([['Analysis ready: Rejection']]);

    await rerender(panel('dismissed'));
    expect(announce.mock.calls).toEqual([
      ['Analysis ready: Rejection'],
      ['Dismissed. Nothing was changed.'],
    ]);
  });
});

describe('MessageRow', () => {
  it('announces when its Triage finishes, not on first render or while pending', async () => {
    const row = (triage: TriageState | undefined) =>
      themed(
        <MessageRow
          message={message}
          triage={triage}
          matched={undefined}
          update={undefined}
          canTriage
          onOpen={jest.fn()}
          onRetry={jest.fn()}
        />,
      );
    const { rerender } = await render(row(undefined));
    await rerender(row({ status: 'pending', startedAt: 1 }));
    expect(announce).not.toHaveBeenCalled();

    await rerender(row({ status: 'done', result, replayed: false, decision: 'open' }));
    expect(announce.mock.calls).toEqual([['Next steps: Interview invite']]);
  });
});
