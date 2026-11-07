import type { PrepSummary } from './selectors';

function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

function parts({ practiced, total, mockCount }: PrepSummary, length: 'long' | 'short'): string[] {
  const questions =
    total === 0
      ? undefined
      : length === 'long'
        ? `${practiced} of ${total} ${plural(total, 'question', 'questions')} practiced`
        : `${practiced} of ${total} practiced`;
  const mocks =
    mockCount === 0
      ? undefined
      : length === 'long'
        ? `${mockCount} ${plural(mockCount, 'mock interview', 'mock interviews')}`
        : `${mockCount} ${plural(mockCount, 'mock', 'mocks')}`;
  return [questions, mocks].filter((part) => part !== undefined);
}

/** Next interview card: "4 of 10 questions practiced · 1 mock interview", or "Prep not started". */
export function prepProgressText(summary: PrepSummary): string {
  const shown = parts(summary, 'long');
  return shown.length === 0 ? 'Prep not started' : shown.join(' · ');
}

/** Application row: "4 of 10 practiced · 1 mock", or "Prep not started". */
export function prepRowText(summary: PrepSummary): string {
  const shown = parts(summary, 'short');
  return shown.length === 0 ? 'Prep not started' : shown.join(' · ');
}

/** End of the row's accessibility label: "Prep: 4 of 10 questions practiced", or "Prep: not started". */
export function prepAccessibilityText(summary: PrepSummary): string {
  const shown = parts(summary, 'long');
  return `Prep: ${shown.length === 0 ? 'not started' : shown.join(', ')}`;
}
