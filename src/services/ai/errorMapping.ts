import { NoObjectGeneratedError } from 'ai';

import type { AppError } from '@/lib/errors';

/** Message patterns for Foundation Models errors, which the provider forwards as plain text. */
const CONTEXT_PATTERN = /context window|context size|exceeded.*context|too (long|many tokens)/i;
const GUARDRAIL_PATTERN = /guardrail|unsafe|refus/i;
const UNAVAILABLE_PATTERN = /not available|unavailable|assets/i;

/** Maps anything thrown by the AI SDK or the Apple provider to the app's error union. */
export function mapAppleError(error: unknown): AppError {
  if (NoObjectGeneratedError.isInstance(error)) {
    return { kind: 'invalid_response', issues: [error.message] };
  }
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  if (code === 'MODEL_UNAVAILABLE') {
    return { kind: 'ai_unavailable', reason: 'apple_intelligence_unavailable' };
  }
  const message = error instanceof Error ? error.message : String(error);
  if (CONTEXT_PATTERN.test(message)) return { kind: 'context_too_long' };
  if (GUARDRAIL_PATTERN.test(message)) return { kind: 'content_blocked' };
  if (UNAVAILABLE_PATTERN.test(message)) {
    return { kind: 'ai_unavailable', reason: 'apple_intelligence_unavailable' };
  }
  return { kind: 'ai_failed', code: code ?? 'unknown' };
}
