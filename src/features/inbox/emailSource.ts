import { describeError, type AppError, type ErrorCopy } from '@/lib/errors';
import type { Result } from '@/lib/result';

import type { InboxMessage } from './schema';

/**
 * Failures an Email Source can report. Adds the two mailbox-specific cases to `AppError`:
 * the sign-in expired, or the mail server answered with an error status.
 */
export type EmailSourceError =
  AppError | { kind: 'reauth_required' } | { kind: 'source_failed'; status: number };

/** Where Inbox Messages come from (ADR 0002). Never throws; failures come back as `EmailSourceError`. */
export interface EmailSource {
  /** Messages received after `since` (ISO timestamp), newest first. */
  listRecent(since: string): Promise<Result<InboxMessage[], EmailSourceError>>;
}

export function describeEmailSourceError(error: EmailSourceError): ErrorCopy {
  switch (error.kind) {
    case 'reauth_required':
      return {
        title: 'Gmail sign-in expired',
        body: 'Connect Gmail again to keep reading new messages.',
        retryable: false,
      };
    case 'source_failed':
      return {
        title: 'Gmail didn’t respond',
        body: `Gmail returned an error (${error.status}). Try again in a moment.`,
        retryable: true,
      };
    case 'invalid_response':
      return {
        title: 'Unexpected response',
        body: 'Gmail returned messages in a format the app couldn’t read.',
        retryable: true,
      };
    default:
      return describeError(error);
  }
}
