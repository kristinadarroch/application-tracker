import type { SharePayload } from 'expo-sharing';

/** What arrived from the share sheet, in intake terms (INT-1). */
export type SharedListing =
  | { kind: 'url'; url: string; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'unsupported' }
  | { kind: 'nothing' };

const WEB_LINK = /https?:\/\/[^\s<>"']+/i;
/** Sentence punctuation after a link in shared text ("…/jobs/view/42.") isn't part of it. */
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

/**
 * Reads the first shared item. Browsers share a URL, or text that contains one;
 * text with a link opens in link mode and keeps the text for paste mode.
 * Images, video, audio, and files can't be imported.
 */
export function readSharedListing(payloads: readonly SharePayload[]): SharedListing {
  const payload = payloads[0];
  if (payload === undefined) return { kind: 'nothing' };
  const value = payload.value.trim();
  const link = WEB_LINK.exec(value)?.[0].replace(TRAILING_PUNCTUATION, '');
  if (payload.shareType === 'url') {
    return link === undefined ? { kind: 'unsupported' } : { kind: 'url', url: link, text: '' };
  }
  if (payload.shareType === 'text') {
    if (value.length === 0) return { kind: 'nothing' };
    return link === undefined
      ? { kind: 'text', text: value }
      : { kind: 'url', url: link, text: value };
  }
  return { kind: 'unsupported' };
}
