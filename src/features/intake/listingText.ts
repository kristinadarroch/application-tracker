import type { ListingUnreadableReason } from '@/lib/errors';
import { err, ok, type Result } from '@/lib/result';

/** Below this, a page has no listing worth sending to the model (e.g. a JavaScript-only app shell). */
export const MIN_LISTING_CHARS = 200;

/** Pages this short that ask for a password are a login screen, not a listing with a sign-in menu. */
const LOGIN_FORM_MAX_CHARS = 400;

/** Elements that never hold listing content. */
const NON_CONTENT_ELEMENTS =
  /<(script|style|noscript|template|svg|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const COMMENTS = /<!--[\s\S]*?-->/g;
const LINE_BREAK_TAGS =
  /<(?:br|\/?(?:p|div|li|ul|ol|h[1-6]|tr|section|article|main|dd|dt|title))\b[^>]*>/gi;
const TAGS = /<[^>]+>/g;
const ENTITIES = /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi;
const PASSWORD_FIELD = /<input\b[^>]*type\s*=\s*["']?password/i;
const LOGIN_PROMPT =
  /\b(?:sign|log) ?in (?:to (?:view|see|continue)|required)\b|\bjoin (?:now )?to (?:view|see)\b/i;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  hellip: '…',
  bull: '•',
  middot: '·',
};

function decodeEntity(match: string, name: string): string {
  if (name.startsWith('#')) {
    const isHex = name[1] === 'x' || name[1] === 'X';
    const code = Number.parseInt(name.slice(isHex ? 2 : 1), isHex ? 16 : 10);
    return Number.isInteger(code) && code > 0 && code <= 0x10ffff
      ? String.fromCodePoint(code)
      : match;
  }
  return NAMED_ENTITIES[name.toLowerCase()] ?? match;
}

/**
 * Visible text of an HTML page, one block per line. Drops scripts, styles,
 * navigation, headers, and footers; decodes common entities in a single pass
 * so `&amp;lt;` becomes `&lt;`, not `<`.
 */
export function htmlToText(html: string): string {
  return (
    html
      .replace(COMMENTS, ' ')
      .replace(NON_CONTENT_ELEMENTS, ' ')
      // Line breaks in HTML source are just spaces; only block elements start a new line.
      .replace(/\s+/g, ' ')
      .replace(LINE_BREAK_TAGS, '\n')
      .replace(TAGS, ' ')
      .replace(ENTITIES, decodeEntity)
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0)
      .join('\n')
  );
}

/**
 * Listing text from a fetched page, or why the page can't be used (INT-3).
 * Login walls are checked first: they are usually short pages too, and
 * "needs a login" tells the user more than "empty".
 */
export function readListingHtml(html: string): Result<string, ListingUnreadableReason> {
  const text = htmlToText(html);
  const asksForPassword = PASSWORD_FIELD.test(html) && text.length < LOGIN_FORM_MAX_CHARS;
  if (asksForPassword || LOGIN_PROMPT.test(text)) return err('login_wall');
  if (text.length < MIN_LISTING_CHARS) return err('empty');
  return ok(text);
}
