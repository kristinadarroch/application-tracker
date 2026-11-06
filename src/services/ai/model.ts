import type { z } from 'zod';

import type { AiUnavailableReason, AppError } from '@/lib/errors';
import type { Result } from '@/lib/result';

/** Context window the app budgets for, whatever the device reports (Apple documents 4,096). */
export const BUDGET_CONTEXT_TOKENS = 4096;

export type AiAvailability =
  | { status: 'available'; contextTokens: number }
  | { status: 'unavailable'; reason: AiUnavailableReason };

export interface GenerateRequest<S extends z.ZodObject> {
  instructions: string;
  prompt: string;
  schema: S;
  timeoutMs: number;
  /**
   * Hard cap on generated tokens. Required: a time limit doesn't stop native generation,
   * and an unbounded request that runs on blocks every request queued behind it.
   */
  maxOutputTokens: number;
  /**
   * `repeatable`: greedy decoding for extraction and triage, so the same input gives the same output.
   * `varied`: nucleus sampling for generated prose (questions, feedback), which also avoids greedy repetition loops.
   */
  sampling: 'repeatable' | 'varied';
}

/** The only way app code talks to an AI model. */
export interface OnDeviceModel {
  availability(): AiAvailability;
  generate<S extends z.ZodObject>(
    request: GenerateRequest<S>,
  ): Promise<Result<z.infer<S>, AppError>>;
}
