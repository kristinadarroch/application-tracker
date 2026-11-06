import type { Application } from '@/features/applications/model';
import type { AppError } from '@/lib/errors';
import { createId, QuestionIdSchema, SessionIdSchema } from '@/lib/ids';
import { err, ok, type Result } from '@/lib/result';
import { inputTokenBudget, trimToTokenBudget } from '@/services/ai/budget';
import { onDeviceModel } from '@/services/ai/foundationModels';

import {
  MockInterviewFirstQuestionOutputSchema,
  MockInterviewTurnOutputSchema,
  PREP_QUESTION_TYPES,
  PrepQuestionsOutputSchema,
  ReviewQuestionsOutputSchema,
  type MockInterviewSession,
  type MockInterviewTurnOutput,
  type PrepQuestion,
  type PrepQuestionSet,
  type ReviewQuestion,
} from './schema';

/** Prep and mock interview generate more text than extraction, so they get a longer limit. */
export const PREP_AI_TIMEOUT_MS = 45_000;

/** Token budgets for the variable parts of each prompt; everything else is short and fixed. */
const NOTES_TOKENS = 300;
const ANSWER_TOKENS = 700;
/** Instructions, schema, and the response for the reviews task. */
const REVIEWS_RESERVED_TOKENS = 1_500;
const MAX_REQUIREMENTS = 8;
const MAX_EARLIER_QUESTIONS = 10;

const PREP_QUESTIONS_INSTRUCTIONS = `You help a job seeker prepare for interviews for one job application.
Write likely interview questions, up to 5 per group.
Role-specific questions must name the role or one of its listed requirements.
"ask_them" questions are ones the candidate asks the interviewer.
Use only the details given. Each question is one sentence.`;

const FIRST_QUESTION_INSTRUCTIONS = `You are the interviewer for the job application below.
Ask the first interview question. Make it specific to this role and its requirements.
Ask exactly one question.`;

const TURN_INSTRUCTIONS = `You are the interviewer for the job application below.
Give feedback on the candidate's answer to the current question: up to 3 strengths, up to 3 gaps, and a stronger example answer written in the first person.
Then ask the next interview question. Do not repeat earlier questions.
Be specific and brief.`;

const REVIEWS_INSTRUCTIONS = `Read interview reviews a job seeker pasted. List the questions candidates say they were asked, up to 8.
For each, copy a short exact quote from the reviews that mentions it. Do not invent questions or quotes.`;

/** Compact description of an application. Requirements are capped and notes trimmed to fit the context budget. */
export function applicationSummary(application: Application): string {
  const lines = [`Company: ${application.company}`, `Role: ${application.role}`];
  if (application.location !== undefined) lines.push(`Location: ${application.location}`);
  const requirements = application.requirements
    .map((requirement) => requirement.trim())
    .filter((requirement) => requirement.length > 0)
    .slice(0, MAX_REQUIREMENTS);
  if (requirements.length > 0) {
    lines.push('Requirements:', ...requirements.map((requirement) => `- ${requirement}`));
  }
  const notes = trimToTokenBudget(application.notes, NOTES_TOKENS).text;
  if (notes.length > 0) lines.push(`Notes: ${notes}`);
  return lines.join('\n');
}

function cleanList(items: string[]): string[] {
  return items.map((item) => item.trim()).filter((item) => item.length > 0);
}

/** PREP-1: questions grouped by type, each with a fresh id and not yet practiced. */
export async function generatePrepQuestions(
  application: Application,
): Promise<Result<PrepQuestionSet, AppError>> {
  const result = await onDeviceModel.generate({
    instructions: PREP_QUESTIONS_INSTRUCTIONS,
    prompt: applicationSummary(application),
    schema: PrepQuestionsOutputSchema,
    timeoutMs: PREP_AI_TIMEOUT_MS,
  });
  if (!result.ok) return result;
  const questions: PrepQuestion[] = PREP_QUESTION_TYPES.flatMap((type) =>
    cleanList(result.value[type]).map((text) => ({
      id: createId(QuestionIdSchema, 'q'),
      type,
      text,
      practiced: false,
    })),
  );
  if (questions.length === 0) {
    return err({ kind: 'invalid_response', issues: ['No questions were generated.'] });
  }
  return ok({ applicationId: application.id, generatedAt: new Date().toISOString(), questions });
}

/** MOCK-1: a new active session whose first turn is the interviewer's opening question. */
export async function startMockInterview(
  application: Application,
): Promise<Result<MockInterviewSession, AppError>> {
  const result = await onDeviceModel.generate({
    instructions: FIRST_QUESTION_INSTRUCTIONS,
    prompt: applicationSummary(application),
    schema: MockInterviewFirstQuestionOutputSchema,
    timeoutMs: PREP_AI_TIMEOUT_MS,
  });
  if (!result.ok) return result;
  const question = result.value.question.trim();
  if (question.length === 0) {
    return err({ kind: 'invalid_response', issues: ['The first question was empty.'] });
  }
  return ok({
    id: createId(SessionIdSchema, 'ses'),
    applicationId: application.id,
    startedAt: new Date().toISOString(),
    status: 'active',
    turns: [{ question }],
  });
}

export interface MockInterviewTurnInput {
  application: Application;
  currentQuestion: string;
  answer: string;
  /** Titles only: the transcript stays in Redux and is never sent, so every turn fits the context budget. */
  earlierQuestions: string[];
}

/** MOCK-2: feedback on one answer plus the next question. */
export async function answerMockInterviewTurn({
  application,
  currentQuestion,
  answer,
  earlierQuestions,
}: MockInterviewTurnInput): Promise<Result<MockInterviewTurnOutput, AppError>> {
  const earlier = earlierQuestions.slice(-MAX_EARLIER_QUESTIONS);
  const prompt = [
    applicationSummary(application),
    ...(earlier.length > 0
      ? ['', 'Earlier questions:', ...earlier.map((question) => `- ${question}`)]
      : []),
    '',
    `Current question: ${currentQuestion}`,
    `Candidate's answer: ${trimToTokenBudget(answer, ANSWER_TOKENS).text}`,
  ].join('\n');
  const result = await onDeviceModel.generate({
    instructions: TURN_INSTRUCTIONS,
    prompt,
    schema: MockInterviewTurnOutputSchema,
    timeoutMs: PREP_AI_TIMEOUT_MS,
  });
  if (!result.ok) return result;
  const nextQuestion = result.value.nextQuestion.trim();
  const strongerAnswer = result.value.feedback.strongerAnswer.trim();
  if (nextQuestion.length === 0 || strongerAnswer.length === 0) {
    return err({ kind: 'invalid_response', issues: ['Feedback or next question was empty.'] });
  }
  return ok({
    feedback: {
      strengths: cleanList(result.value.feedback.strengths),
      gaps: cleanList(result.value.feedback.gaps),
      strongerAnswer,
    },
    nextQuestion,
  });
}

export interface ReviewQuestionsInput {
  application: Application;
  reviews: string;
}

export interface ReviewQuestions {
  questions: ReviewQuestion[];
  /** Only the first part of very long pasted text was read. */
  trimmed: boolean;
}

/** Case, whitespace, and quote-mark differences don't make a quote "made up". */
function normalizeForQuote(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”"‘’'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** LATER-1: likely questions from pasted reviews. Questions whose quote isn't in the pasted text are dropped. */
export async function findReviewQuestions({
  application,
  reviews,
}: ReviewQuestionsInput): Promise<Result<ReviewQuestions, AppError>> {
  const source = trimToTokenBudget(reviews, inputTokenBudget(REVIEWS_RESERVED_TOKENS));
  const result = await onDeviceModel.generate({
    instructions: REVIEWS_INSTRUCTIONS,
    prompt: `Reviews for ${application.role} at ${application.company}:\n${source.text}`,
    schema: ReviewQuestionsOutputSchema,
    timeoutMs: PREP_AI_TIMEOUT_MS,
    deterministic: true,
  });
  if (!result.ok) return result;
  const haystack = normalizeForQuote(source.text);
  const questions = result.value.questions
    .map(({ question, quote }) => ({ question: question.trim(), quote: quote.trim() }))
    .filter(
      ({ question, quote }) =>
        question.length > 0 && quote.length > 0 && haystack.includes(normalizeForQuote(quote)),
    );
  if (questions.length === 0) {
    return err({
      kind: 'invalid_response',
      issues: ['No questions with a quote from the pasted text.'],
    });
  }
  return ok({ questions, trimmed: source.trimmed });
}
