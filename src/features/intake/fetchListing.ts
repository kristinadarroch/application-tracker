import type { AppError } from '@/lib/errors';
import { err, ok, type Result } from '@/lib/result';

import { readListingHtml } from './listingText';

export const LISTING_FETCH_TIMEOUT_MS = 10_000;

const HTML_CONTENT_TYPE = /\b(?:text\/html|application\/xhtml\+xml)\b/i;

export interface FetchListingOptions {
  timeoutMs?: number;
  /** Aborts the request when the caller no longer needs it (e.g. the screen closed). */
  signal?: AbortSignal;
}

/**
 * Loads a Job Listing page on the device and returns its readable text.
 * Never throws: every failure is a `network`, `timeout`, or `listing_unreadable` error.
 */
export async function fetchListing(
  url: string,
  { timeoutMs = LISTING_FETCH_TIMEOUT_MS, signal }: FetchListingOptions = {},
): Promise<Result<string, AppError>> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/html,application/xhtml+xml' },
    });
    if (!response.ok) return err({ kind: 'listing_unreadable', reason: 'blocked' });
    const contentType = response.headers.get('content-type');
    if (contentType !== null && !HTML_CONTENT_TYPE.test(contentType)) {
      return err({ kind: 'listing_unreadable', reason: 'non_html' });
    }
    const page = readListingHtml(await response.text());
    return page.ok ? ok(page.value) : err({ kind: 'listing_unreadable', reason: page.error });
  } catch {
    // `fetch` rejects with a TypeError when offline or the host can't be reached, and with an AbortError on timeout.
    return err(timedOut ? { kind: 'timeout', afterMs: timeoutMs } : { kind: 'network' });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}
