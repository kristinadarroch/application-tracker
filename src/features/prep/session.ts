import type { MockInterviewSession } from './schema';

export interface SessionSummary {
  answered: number;
  strengths: string[];
  gaps: string[];
}

/** Dedupe ignoring case: the model often repeats a point across answers. */
function unique(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** MOCK-5: strengths and gaps across every answer that got feedback. No AI call needed. */
export function summarizeSession(session: MockInterviewSession): SessionSummary {
  const reviewed = session.turns.flatMap((turn) =>
    turn.feedback === undefined ? [] : [turn.feedback],
  );
  return {
    answered: reviewed.length,
    strengths: unique(reviewed.flatMap((feedback) => feedback.strengths)),
    gaps: unique(reviewed.flatMap((feedback) => feedback.gaps)),
  };
}

/** "Mar 3, 2:15 PM" in the device's locale. */
export function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
