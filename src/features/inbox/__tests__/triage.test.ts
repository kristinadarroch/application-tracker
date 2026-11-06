import { ApplicationIdSchema, MessageIdSchema } from '@/lib/ids';

import type { TriageCandidate } from '../schema';
import { replayedTriageOutput, toTriageResult, type TriageOutput } from '../triage';

const acmeId = ApplicationIdSchema.parse('app_acme');
const candidates: TriageCandidate[] = [
  { id: acmeId, company: 'Acme Health', role: 'Senior React Native Engineer' },
  { id: ApplicationIdSchema.parse('app_globex'), company: 'Globex', role: 'Mobile Engineer' },
];
// Local noon, so the calendar-day math doesn't depend on the test machine's time zone.
const receivedAt = new Date(2026, 10, 5, 12, 0).toISOString();

const invite: TriageOutput = {
  matchedApplicationId: acmeId,
  category: 'interview_invite',
  confidence: 'high',
  nextStepTitle: 'Book interview',
  dueInDays: 2,
};

describe('toTriageResult', () => {
  it('links a valid match and dates the proposal from when the message arrived', () => {
    expect(toTriageResult(invite, candidates, receivedAt)).toEqual({
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
      new Date(2026, 11, 15, 12).toISOString(),
    );
    expect(result.ok && result.value.proposedNextStep?.dueDate).toBe('2027-01-14');
  });

  it('treats an application id that does not exist as an unexpected response (INBX-4)', () => {
    const result = toTriageResult(
      { ...invite, matchedApplicationId: 'app_made_up' },
      candidates,
      receivedAt,
    );
    expect(result).toEqual({
      ok: false,
      error: { kind: 'invalid_response', issues: [expect.stringContaining('app_made_up')] },
    });
  });

  it('leaves the message unmatched when the model answers none', () => {
    const result = toTriageResult(
      { ...invite, category: 'rejection', matchedApplicationId: 'none', nextStepTitle: '' },
      candidates,
      receivedAt,
    );
    expect(result).toEqual({
      ok: true,
      value: { category: 'rejection', applicationId: null, confidence: 'high' },
    });
  });

  it('labels unrelated messages and proposes nothing, even if the model suggested a step (INBX-3)', () => {
    const result = toTriageResult({ ...invite, category: 'unrelated' }, candidates, receivedAt);
    expect(result).toEqual({
      ok: true,
      value: { category: 'unrelated', applicationId: null, confidence: 'high' },
    });
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
