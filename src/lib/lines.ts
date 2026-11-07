/** Which of the four Transit lines an application rides, and the letter on its roundel. */
export interface LineIdentity {
  index: 0 | 1 | 2 | 3;
  letter: string;
}

const LINE_INDEXES = [0, 1, 2, 3] as const;

/**
 * Stable per application: the same id always gets the same line, across launches and devices,
 * with nothing extra to store. Color is never the only signal: each line index also has its own
 * roundel shape, and the letter is the company's initial.
 */
export function lineFor(applicationId: string, company: string): LineIdentity {
  let hash = 0;
  for (const char of applicationId) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  const index = LINE_INDEXES[hash % LINE_INDEXES.length] ?? 0;
  const initial = company.trim().match(/[\p{L}\p{N}]/u)?.[0];
  return { index, letter: initial === undefined ? '•' : initial.toLocaleUpperCase() };
}
