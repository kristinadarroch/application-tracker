import { ApplicationIdSchema, MessageIdSchema } from '@/lib/ids';

import { FIXTURE_MESSAGES } from '../mockEmailSource';
import type { InboxMessage, TriageCandidate } from '../schema';
import {
  mentionsCompany,
  replayedTriageOutput,
  toTriageResult,
  type TriageOutput,
} from '../triage';

const acmeId = ApplicationIdSchema.parse('app_acme');
const globexId = ApplicationIdSchema.parse('app_globex');
const northwindId = ApplicationIdSchema.parse('app_northwind');
const candidates: TriageCandidate[] = [
  { id: acmeId, company: 'Acme Health', role: 'Senior React Native Engineer' },
  { id: globexId, company: 'Globex', role: 'Mobile Engineer' },
  { id: northwindId, company: 'Northwind Labs', role: 'Frontend Engineer (React)' },
];

/** A sample message, received at local noon so day math doesn't depend on the time zone. */
function fixture(id: string, receivedAt = new Date(2026, 10, 5, 12, 0)): InboxMessage {
  const message = FIXTURE_MESSAGES.find((m) => m.id === id);
  if (message === undefined) throw new Error(`No fixture ${id}`);
  return { ...message, receivedAt: receivedAt.toISOString() };
}

const acmeInvite = fixture('msg_fixture_acme_invite');
const invite: TriageOutput = {
  matchedApplicationId: acmeId,
  category: 'interview_invite',
  confidence: 'high',
  nextStepTitle: 'Book interview',
  dueInDays: 2,
};

describe('toTriageResult', () => {
  it('reads an id the model wrapped in stray punctuation (seen on device)', () => {
    const result = toTriageResult(
      { ...invite, matchedApplicationId: `${acmeId}',` },
      candidates,
      acmeInvite,
    );
    expect(result.ok && result.value.applicationId).toBe(acmeId);
  });

  it('shortens a long proposed title at a word boundary instead of rejecting the response', () => {
    const longTitle =
      'Book a forty-five minute technical interview with the mobile lead using the scheduling link in the email';
    const result = toTriageResult({ ...invite, nextStepTitle: longTitle }, candidates, acmeInvite);
    const title = result.ok ? result.value.proposedNextStep?.title : undefined;
    expect(title?.length).toBeLessThanOrEqual(81);
    expect(title?.endsWith('…')).toBe(true);
    expect(longTitle.startsWith(title?.slice(0, -1) ?? '-')).toBe(true);
  });

  it('keeps due days within 0–30 and whole days', () => {
    const late = toTriageResult({ ...invite, dueInDays: 90 }, candidates, acmeInvite);
    const early = toTriageResult({ ...invite, dueInDays: -3.6 }, candidates, acmeInvite);
    expect(late.ok && late.value.proposedNextStep?.dueDate).toBe('2026-12-05');
    expect(early.ok && early.value.proposedNextStep?.dueDate).toBe('2026-11-05');
  });

  it('keeps a match the message names and dates the proposal from when it arrived', () => {
    expect(toTriageResult(invite, candidates, acmeInvite)).toEqual({
      ok: true,
      value: {
        category: 'interview_invite',
        applicationId: acmeId,
        confidence: 'high',
        proposedNextStep: { title: 'Book interview', dueDate: '2026-11-07' },
      },
    });
  });

  it('counts due days across a month boundary', () => {
    const result = toTriageResult(
      { ...invite, dueInDays: 30 },
      candidates,
      fixture('msg_fixture_acme_invite', new Date(2026, 11, 15, 12)),
    );
    expect(result.ok && result.value.proposedNextStep?.dueDate).toBe('2027-01-14');
  });

  it('treats an application id that does not exist as an unexpected response (INBX-4)', () => {
    const result = toTriageResult(
      { ...invite, matchedApplicationId: 'app_made_up' },
      candidates,
      acmeInvite,
    );
    expect(result).toEqual({
      ok: false,
      error: { kind: 'invalid_response', issues: [expect.stringContaining('app_made_up')] },
    });
  });

  it('drops a match to a company the message never names, and never proposes a step for a rejection', () => {
    // Seen on device: the Initech rejection matched to Globex with "Apply for future openings".
    const result = toTriageResult(
      {
        matchedApplicationId: globexId,
        category: 'rejection',
        confidence: 'low',
        nextStepTitle: 'Apply for future openings',
        dueInDays: 7,
      },
      candidates,
      fixture('msg_fixture_initech_rejection'),
    );
    expect(result).toEqual({
      ok: true,
      value: { category: 'rejection', applicationId: null, confidence: 'low' },
    });
  });

  it('marks an ungrounded match low confidence so the user chooses (INBX-4)', () => {
    const result = toTriageResult(
      { ...invite, matchedApplicationId: globexId },
      candidates,
      acmeInvite,
    );
    expect(result).toMatchObject({ ok: true, value: { applicationId: null, confidence: 'low' } });
  });

  it('labels unrelated messages and proposes nothing, even if the model suggested a step (INBX-3)', () => {
    const result = toTriageResult(
      { ...invite, category: 'unrelated' },
      candidates,
      fixture('msg_fixture_newsletter'),
    );
    expect(result).toEqual({
      ok: true,
      value: { category: 'unrelated', applicationId: null, confidence: 'high' },
    });
  });

  it('proposes a default Next Step when the model leaves the title out of an interview invite (INBX-2)', () => {
    const result = toTriageResult(
      { matchedApplicationId: acmeId, category: 'interview_invite', confidence: 'high' },
      candidates,
      acmeInvite,
    );
    expect(result.ok && result.value.proposedNextStep).toEqual({
      title: 'Book the interview',
      dueDate: '2026-11-07',
    });
  });

  it.each([
    ['scheduling', 'Pick a time'],
    ['take_home', 'Submit the take-home'],
    ['recruiter_followup', 'Reply to the recruiter'],
  ] as const)('defaults the %s Next Step to "%s"', (category, title) => {
    const result = toTriageResult(
      { ...invite, category, nextStepTitle: ' ' },
      candidates,
      acmeInvite,
    );
    expect(result.ok && result.value.proposedNextStep?.title).toBe(title);
  });

  it('keeps an offer’s Next Step only when the model gave one', () => {
    const offer = fixture('msg_fixture_acme_offer');
    const withTitle = toTriageResult(
      { ...invite, category: 'offer', nextStepTitle: 'Respond to offer' },
      candidates,
      offer,
    );
    const withoutTitle = toTriageResult(
      { ...invite, category: 'offer', nextStepTitle: '' },
      candidates,
      offer,
    );
    expect(withTitle.ok && withTitle.value.proposedNextStep?.title).toBe('Respond to offer');
    expect(withoutTitle.ok && withoutTitle.value.proposedNextStep).toBeUndefined();
  });
});

describe('mentionsCompany', () => {
  const message = (fields: Partial<InboxMessage>): InboxMessage => ({
    ...acmeInvite,
    fromName: 'Recruiting',
    from: 'jobs@example.com',
    subject: 'Hello',
    bodyText: 'Thanks for applying.',
    ...fields,
  });

  it('counts a sender domain that spells the company without spaces', () => {
    expect(
      mentionsCompany(message({ from: 'recruiting@northwindlabs.com' }), 'Northwind Labs'),
    ).toBe(true);
  });

  it('matches whole words across punctuation, case-insensitively', () => {
    expect(
      mentionsCompany(message({ subject: 'Next steps — ACME-health team' }), 'Acme Health'),
    ).toBe(true);
    expect(mentionsCompany(message({ bodyText: 'Globexia is hiring' }), 'Globex')).toBe(false);
  });

  it('is false when nothing names the company', () => {
    expect(mentionsCompany(fixture('msg_fixture_initech_rejection'), 'Globex')).toBe(false);
  });
});

describe('replayedTriageOutput', () => {
  it('resolves the recorded company to the matching application', () => {
    const output = replayedTriageOutput(
      MessageIdSchema.parse('msg_fixture_acme_invite'),
      candidates,
    );
    expect(output).toMatchObject({ matchedApplicationId: acmeId, category: 'interview_invite' });
  });

  it('answers none when the recorded company has no application', () => {
    const output = replayedTriageOutput(
      MessageIdSchema.parse('msg_fixture_northwind_schedule'),
      [],
    );
    expect(output?.matchedApplicationId).toBe('none');
  });

  it('has no recording for messages outside the sample set', () => {
    expect(replayedTriageOutput(MessageIdSchema.parse('gmail_123'), candidates)).toBeUndefined();
  });
});
