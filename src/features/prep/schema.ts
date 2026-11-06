import { z } from 'zod';

import { ApplicationIdSchema, QuestionIdSchema, SessionIdSchema } from '@/lib/ids';

// ---------------------------------------------------------------------------
// Domain (persisted in the `prep` slice)
// ---------------------------------------------------------------------------

/** Display order of the groups on the prep questions screen (PREP-1). */
export const PREP_QUESTION_TYPES = [
  'behavioral',
  'technical',
  'role_specific',
  'ask_them',
] as const;
export const PrepQuestionTypeSchema = z.enum(PREP_QUESTION_TYPES);
export type PrepQuestionType = z.infer<typeof PrepQuestionTypeSchema>;

export const PREP_QUESTION_TYPE_LABELS: Record<PrepQuestionType, string> = {
  behavioral: 'Behavioral',
  technical: 'Technical',
  role_specific: 'Role-specific',
  ask_them: 'Questions to ask them',
};

export const PrepQuestionSchema = z.object({
  id: QuestionIdSchema,
  type: PrepQuestionTypeSchema,
  text: z.string().trim().min(1),
  practiced: z.boolean(),
});
export type PrepQuestion = z.infer<typeof PrepQuestionSchema>;

export const PrepQuestionSetSchema = z.object({
  applicationId: ApplicationIdSchema,
  generatedAt: z.string(),
  questions: z.array(PrepQuestionSchema),
});
export type PrepQuestionSet = z.infer<typeof PrepQuestionSetSchema>;

/** Answer Feedback as stored on a turn. The model returns these fields flat, see `MockInterviewTurnOutputSchema`. */
export const AnswerFeedbackSchema = z.object({
  strengths: z.array(z.string()).max(3),
  gaps: z.array(z.string()).max(3),
  strongerAnswer: z.string(),
});
export type AnswerFeedback = z.infer<typeof AnswerFeedbackSchema>;

/** One question in a session. `answer` is stored as soon as it is submitted, before feedback arrives (MOCK-3). */
export const MockInterviewTurnSchema = z.object({
  question: z.string(),
  answer: z.string().optional(),
  feedback: AnswerFeedbackSchema.optional(),
});
export type MockInterviewTurn = z.infer<typeof MockInterviewTurnSchema>;

export const MockInterviewSessionSchema = z.object({
  id: SessionIdSchema,
  applicationId: ApplicationIdSchema,
  startedAt: z.string(),
  endedAt: z.string().optional(),
  status: z.enum(['active', 'ended']),
  turns: z.array(MockInterviewTurnSchema),
});
export type MockInterviewSession = z.infer<typeof MockInterviewSessionSchema>;

/** A likely question found in pasted interview reviews, with the text it came from (LATER-1). Not persisted. */
export const ReviewQuestionSchema = z.object({
  question: z.string(),
  quote: z.string(),
});
export type ReviewQuestion = z.infer<typeof ReviewQuestionSchema>;

// ---------------------------------------------------------------------------
// On-device model output. Root `z.object`, no unions or nullables, bounded arrays.
// Flat only: the provider turns nested objects into unnamed sub-schemas, which hang
// generation on device (seen 2026-11-05).
// ---------------------------------------------------------------------------

const questionList = (description: string) => z.array(z.string()).max(5).describe(description);

/** Keys match `PrepQuestionType`, so mapping to domain questions is a loop over `PREP_QUESTION_TYPES`. */
export const PrepQuestionsOutputSchema = z.object({
  behavioral: questionList('Questions about past experience and teamwork'),
  technical: questionList('Questions about technical skills for this role'),
  role_specific: questionList('Questions naming this role or one of its requirements'),
  ask_them: questionList('Questions the candidate asks the interviewer'),
});
export type PrepQuestionsOutput = z.infer<typeof PrepQuestionsOutputSchema>;

export const MockInterviewFirstQuestionOutputSchema = z.object({
  question: z.string(),
});

/** Feedback fields plus the next question, flat; tasks map them to `AnswerFeedback`. */
export const MockInterviewTurnOutputSchema = z.object({
  strengths: z.array(z.string()).max(3),
  gaps: z.array(z.string()).max(3),
  strongerAnswer: z.string(),
  nextQuestion: z.string(),
});

/** Paired by index: `quotes[i]` is the review text that `questions[i]` came from. */
export const ReviewQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).max(8),
  quotes: z.array(z.string()).max(8),
});
