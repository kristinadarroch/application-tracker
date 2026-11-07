/** Which of the four accent colors an application uses, and the letter on its company badge. */
export interface CompanyAccent {
  index: 0 | 1 | 2 | 3;
  letter: string;
}

const ACCENT_INDEXES = [0, 1, 2, 3] as const;

/**
 * Stable per application: the same id always gets the same accent, across launches and devices,
 * with nothing extra to store. Color is never the only signal: each accent index also has its own
 * badge shape, and the letter is the company's initial.
 */
export function accentFor(applicationId: string, company: string): CompanyAccent {
  let hash = 0;
  for (const char of applicationId) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  const index = ACCENT_INDEXES[hash % ACCENT_INDEXES.length] ?? 0;
  const initial = company.trim().match(/[\p{L}\p{N}]/u)?.[0];
  return { index, letter: initial === undefined ? '•' : initial.toLocaleUpperCase() };
}
