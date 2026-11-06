import { BUDGET_CONTEXT_TOKENS } from './model';

/** English text averages 3–4 characters per token (Apple's context-window guide); 3 keeps estimates conservative. */
const CHARS_PER_TOKEN = 3;

/** Tokens left for task input after instructions, the output schema, and the response. */
export function inputTokenBudget(reservedTokens: number): number {
  return Math.max(0, BUDGET_CONTEXT_TOKENS - reservedTokens);
}

/** Lines that are navigation, legal, or cookie boilerplate rather than listing content. */
const BOILERPLATE =
  /^(?:©|(?:skip to (?:main )?content|cookie|accept(?: all)? cookies|privacy policy|terms of (?:use|service)|copyright|all rights reserved|sign in|log in|share this job|apply now)\b)/i;

export function stripBoilerplate(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0 && !BOILERPLATE.test(line))
    .join('\n');
}

export interface TrimmedText {
  text: string;
  /** True when content was cut to fit; the UI tells the user only part was read. */
  trimmed: boolean;
}

/**
 * Fits text into a token budget. Keeps the beginning, where job listings put
 * company and role, and cuts at a line or word boundary.
 */
export function trimToTokenBudget(text: string, maxTokens: number): TrimmedText {
  const cleaned = stripBoilerplate(text);
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (cleaned.length <= maxChars) return { text: cleaned, trimmed: false };
  const slice = cleaned.slice(0, maxChars);
  const lastBreak = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf(' '));
  return {
    text: slice.slice(0, lastBreak > maxChars / 2 ? lastBreak : maxChars).trimEnd(),
    trimmed: true,
  };
}
