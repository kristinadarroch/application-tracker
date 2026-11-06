import { err, ok } from '@/lib/result';

import {
  answerMockInterviewTurn,
  findReviewQuestions,
  generatePrepQuestions,
  startMockInterview,
} from '../tasks';
import { fakeGenerate, makeApplication } from '../testing';

jest.mock('@/services/ai/foundationModels', () => ({
  onDeviceModel: { availability: jest.fn(), generate: jest.fn() },
}));

beforeEach(() => fakeGenerate.mockReset());

const application = makeApplication();

describe('generatePrepQuestions', () => {
  it('maps model output to typed, unpracticed questions grouped by type (PREP-1)', async () => {
    fakeGenerate.mockResolvedValueOnce(
      ok({
        behavioral: ['Tell me about a conflict on your team.'],
        technical: ['How does the React Native New Architecture work?', '  '],
        role_specific: ['How have you used Redux Toolkit as a Senior React Native Engineer?'],
        ask_them: ['How do you measure mobile app quality?'],
      }),
    );

    const result = await generatePrepQuestions(application);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.applicationId).toBe(application.id);
    expect(
      result.value.questions.map(({ type, text, practiced }) => ({ type, text, practiced })),
    ).toEqual([
      { type: 'behavioral', text: 'Tell me about a conflict on your team.', practiced: false },
      {
        type: 'technical',
        text: 'How does the React Native New Architecture work?',
        practiced: false,
      },
      {
        type: 'role_specific',
        text: 'How have you used Redux Toolkit as a Senior React Native Engineer?',
        practiced: false,
      },
      { type: 'ask_them', text: 'How do you measure mobile app quality?', practiced: false },
    ]);
    expect(new Set(result.value.questions.map((q) => q.id)).size).toBe(4);
  });

  it('sends a compact application summary with the role and requirements', async () => {
    fakeGenerate.mockResolvedValueOnce(err({ kind: 'timeout', afterMs: 45_000 }));
    await generatePrepQuestions(
      makeApplication({
        requirements: Array.from({ length: 12 }, (_, i) => `Requirement ${i + 1}`),
      }),
    );

    const request = fakeGenerate.mock.calls[0]?.[0];
    expect(request?.prompt).toContain('Role: Senior React Native Engineer');
    expect(request?.prompt).toContain('- Requirement 8');
    expect(request?.prompt).not.toContain('Requirement 9');
    expect(request?.timeoutMs).toBe(45_000);
  });

  it('passes model errors through and rejects an empty set', async () => {
    fakeGenerate.mockResolvedValueOnce(err({ kind: 'timeout', afterMs: 45_000 }));
    expect(await generatePrepQuestions(application)).toEqual(
      err({ kind: 'timeout', afterMs: 45_000 }),
    );

    fakeGenerate.mockResolvedValueOnce(
      ok({ behavioral: [], technical: [], role_specific: [], ask_them: [] }),
    );
    const empty = await generatePrepQuestions(application);
    expect(empty.ok ? undefined : empty.error.kind).toBe('invalid_response');
  });
});

describe('startMockInterview', () => {
  it('creates an active session whose first turn is the model’s question (MOCK-1)', async () => {
    fakeGenerate.mockResolvedValueOnce(
      ok({ question: 'Walk me through a React Native app you shipped.' }),
    );

    const result = await startMockInterview(application);

    expect(result.ok && result.value).toMatchObject({
      applicationId: application.id,
      status: 'active',
      turns: [{ question: 'Walk me through a React Native app you shipped.' }],
    });
  });
});

describe('answerMockInterviewTurn', () => {
  it('sends only the summary, current question, answer, and earlier question titles', async () => {
    fakeGenerate.mockResolvedValueOnce(
      ok({
        strengths: ['Specific'],
        gaps: [' ', 'No metrics'],
        strongerAnswer: 'I led…',
        nextQuestion: 'How do you profile a slow list?',
      }),
    );

    const result = await answerMockInterviewTurn({
      application,
      currentQuestion: 'How do you handle offline mode?',
      answer: 'I queue writes in Redux.',
      earlierQuestions: ['Tell me about yourself.'],
    });

    const prompt = fakeGenerate.mock.calls[0]?.[0].prompt ?? '';
    expect(prompt).toContain('Company: Acme Health');
    expect(prompt).toContain('- Tell me about yourself.');
    expect(prompt).toContain('Current question: How do you handle offline mode?');
    expect(prompt).toContain("Candidate's answer: I queue writes in Redux.");
    expect(result).toEqual(
      ok({
        feedback: { strengths: ['Specific'], gaps: ['No metrics'], strongerAnswer: 'I led…' },
        nextQuestion: 'How do you profile a slow list?',
      }),
    );
  });
});

describe('findReviewQuestions', () => {
  const reviews = `Three rounds. They asked me to “design an offline sync queue. Keep it simple.”
The manager asked how I handle disagreements with designers.`;

  it('asks the model for questions only and quotes the review text in code (LATER-1)', async () => {
    fakeGenerate.mockResolvedValueOnce(
      ok({
        questions: [
          'Design an offline sync queue.',
          'How do you handle disagreements with designers?',
          'Reverse a linked list.',
        ],
      }),
    );

    const result = await findReviewQuestions({ application, reviews });

    expect(fakeGenerate.mock.calls[0]?.[0].prompt).toContain(
      'The manager asked how I handle disagreements with designers.',
    );
    expect(result).toEqual(
      ok({
        questions: [
          {
            question: 'Design an offline sync queue.',
            quote: 'They asked me to “design an offline sync queue. Keep it simple.”',
          },
          {
            question: 'How do you handle disagreements with designers?',
            quote: 'The manager asked how I handle disagreements with designers.',
          },
        ],
        trimmed: false,
      }),
    );
  });

  it('returns an empty list, not an error, when the model finds no questions', async () => {
    fakeGenerate.mockResolvedValueOnce(ok({ questions: [] }));
    expect(await findReviewQuestions({ application, reviews })).toEqual(
      ok({ questions: [], trimmed: false }),
    );
  });
});
