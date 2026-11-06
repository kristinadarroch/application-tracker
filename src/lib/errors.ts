import { assertNever } from './assertNever';

/** Why AI can't run. The provider reports availability as a boolean, so iPhone-side causes share one reason. */
export type AiUnavailableReason =
  'unsupported_platform' | 'os_too_old' | 'apple_intelligence_unavailable';

export type ListingUnreadableReason = 'blocked' | 'empty' | 'login_wall' | 'non_html';

/** Every failure the UI can show. Screens never see raw exceptions. */
export type AppError =
  | { kind: 'network' }
  | { kind: 'timeout'; afterMs: number }
  | { kind: 'invalid_response'; issues: string[] }
  | { kind: 'ai_unavailable'; reason: AiUnavailableReason }
  | { kind: 'context_too_long' }
  | { kind: 'content_blocked' }
  | { kind: 'ai_failed'; code: string }
  | { kind: 'listing_unreadable'; reason: ListingUnreadableReason }
  | { kind: 'not_found'; entity: 'application' | 'draft' | 'message' };

export interface ErrorCopy {
  title: string;
  body: string;
  /** Whether trying the same thing again can plausibly succeed. */
  retryable: boolean;
}

const aiUnavailableBody: Record<AiUnavailableReason, string> = {
  unsupported_platform:
    'AI features need Apple Intelligence, which isn’t available on this device.',
  os_too_old: 'AI features need iOS 26 or later. Update iOS to use them.',
  apple_intelligence_unavailable:
    'Apple Intelligence isn’t available. Check that it’s turned on in Settings → Apple Intelligence & Siri and that this iPhone supports it.',
};

const unreadableBody: Record<ListingUnreadableReason, string> = {
  blocked: 'The site blocked the request. Paste the listing text instead.',
  empty: 'The page had no listing text. Paste the listing text instead.',
  login_wall: 'The page needs a login. Paste the listing text instead.',
  non_html: 'That link isn’t a web page. Paste the listing text instead.',
};

/** Plain-language copy for an error, used by `ErrorState`. */
export function describeError(error: AppError): ErrorCopy {
  switch (error.kind) {
    case 'network':
      return {
        title: 'You’re offline',
        body: 'Check your connection and try again.',
        retryable: true,
      };
    case 'timeout':
      return { title: 'That took too long', body: 'Try again in a moment.', retryable: true };
    case 'invalid_response':
      return {
        title: 'Unexpected response',
        body: 'The AI returned something we couldn’t use.',
        retryable: true,
      };
    case 'ai_failed':
      return {
        title: 'AI couldn’t finish',
        body: 'Something went wrong while generating. Try again.',
        retryable: true,
      };
    case 'ai_unavailable':
      return {
        title: 'AI isn’t available',
        body: aiUnavailableBody[error.reason],
        retryable: false,
      };
    case 'context_too_long':
      return {
        title: 'Too much text',
        body: 'Shorten the text and try again.',
        retryable: false,
      };
    case 'content_blocked':
      return {
        title: 'Request declined',
        body: 'Apple Intelligence declined this request. Edit the text and try again.',
        retryable: false,
      };
    case 'listing_unreadable':
      return {
        title: 'Couldn’t read this page',
        body: unreadableBody[error.reason],
        retryable: false,
      };
    case 'not_found':
      return {
        title: 'Not found',
        body: `This ${error.entity} no longer exists.`,
        retryable: false,
      };
    default:
      return assertNever(error);
  }
}
