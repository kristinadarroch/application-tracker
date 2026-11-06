import type { ReviewQuestion } from './schema';

/** A quote must share at least this many content words with its question, or the question is dropped. */
const MIN_SHARED_WORDS = 2;

/** Words that carry no topic. Includes review filler ("asked", "interview") that would match every sentence. */
const STOP_WORDS = new Set(
  (
    'a about an and are as ask asked at be been but by can could did do does for from had has have he ' +
    'her his how i if in interview interviewer is it me my of on or our question questions she so tell ' +
    'that the their them then there they this to us was we were what when where which who why will ' +
    'with would you your'
  ).split(' '),
);

/** Lowercased content words, with a plural "s" dropped so "designers" matches "designer". */
function contentWords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    .map((word) => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word));
  return new Set(words);
}

/** Splits on line breaks and on `.`, `?`, `!` before whitespace, but never inside a quoted span. */
function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let current = '';
  let quoted = false;
  const flush = () => {
    const sentence = current.trim();
    if (sentence.length > 0) sentences.push(sentence);
    current = '';
  };
  const chars = Array.from(text);
  for (const [index, char] of chars.entries()) {
    if (char === '\n') {
      // A line break ends the sentence even if a quote was left open.
      flush();
      quoted = false;
      continue;
    }
    current += char;
    const wasQuoted = quoted;
    if (char === '“') quoted = true;
    else if (char === '”') quoted = false;
    else if (char === '"') quoted = !quoted;
    // A sentence ends at `.?!`, or at a closing quote right after one (`…do?" I said`).
    const terminal =
      /[.?!]/.test(char) || (wasQuoted && !quoted && /[.?!]/.test(chars[index - 1] ?? ''));
    const next = chars[index + 1];
    if (!quoted && terminal && (next === undefined || /\s/.test(next))) flush();
  }
  flush();
  return sentences;
}

/**
 * LATER-1: pairs each question with the review sentence that shares the most content words.
 * Every quote is real text from the reviews; questions with no sentence sharing at least
 * `MIN_SHARED_WORDS` content words are dropped, as are duplicates.
 */
export function quoteReviewQuestions(questions: string[], reviews: string): ReviewQuestion[] {
  const sentences = splitSentences(reviews).map((text) => ({ text, words: contentWords(text) }));
  const seen = new Set<string>();
  const quoted: ReviewQuestion[] = [];
  for (const raw of questions) {
    const question = raw.trim();
    const key = question.toLowerCase();
    if (question.length === 0 || seen.has(key)) continue;
    seen.add(key);
    const questionWords = [...contentWords(question)];
    let best = { quote: '', shared: 0 };
    for (const sentence of sentences) {
      const shared = questionWords.filter((word) => sentence.words.has(word)).length;
      if (shared > best.shared) best = { quote: sentence.text, shared };
    }
    if (best.shared >= MIN_SHARED_WORDS) quoted.push({ question, quote: best.quote });
  }
  return quoted;
}
