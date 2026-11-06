import { z } from 'zod';

/** Branded IDs so an application ID can't be passed where a message ID is expected. */
export const ApplicationIdSchema = z.string().min(1).brand<'ApplicationId'>();
export const NextStepIdSchema = z.string().min(1).brand<'NextStepId'>();
export const DraftIdSchema = z.string().min(1).brand<'DraftId'>();
export const MessageIdSchema = z.string().min(1).brand<'MessageId'>();
export const SessionIdSchema = z.string().min(1).brand<'SessionId'>();
export const QuestionIdSchema = z.string().min(1).brand<'QuestionId'>();

export type ApplicationId = z.infer<typeof ApplicationIdSchema>;
export type NextStepId = z.infer<typeof NextStepIdSchema>;
export type DraftId = z.infer<typeof DraftIdSchema>;
export type MessageId = z.infer<typeof MessageIdSchema>;
export type SessionId = z.infer<typeof SessionIdSchema>;
export type QuestionId = z.infer<typeof QuestionIdSchema>;

/** Collision-safe enough for local, single-user data. Not for security. */
export function createId<S extends z.ZodType<string>>(schema: S, prefix: string): z.infer<S> {
  const random = Math.random().toString(36).slice(2, 10);
  return schema.parse(`${prefix}_${Date.now().toString(36)}${random}`);
}
