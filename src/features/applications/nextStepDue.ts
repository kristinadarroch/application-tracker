import { addDays, formatDueDate, toIsoDate, type IsoDate } from '@/lib/dates';

/** "Overdue · Mar 3", "Due today", "Due tomorrow", or "Due Fri, Mar 7". Text, so urgency never relies on color. */
export function dueLabel(dueDate: IsoDate, now: Date): string {
  const today = toIsoDate(now);
  if (dueDate < today) return formatDueDate(dueDate, now);
  if (dueDate === today) return 'Due today';
  if (dueDate === toIsoDate(addDays(now, 1))) return 'Due tomorrow';
  return `Due ${formatDueDate(dueDate, now)}`;
}

export interface DueQuickPick {
  label: string;
  daysFromToday: number;
}

export const DUE_QUICK_PICKS: readonly DueQuickPick[] = [
  { label: 'Today', daysFromToday: 0 },
  { label: 'Tomorrow', daysFromToday: 1 },
  { label: 'In 3 days', daysFromToday: 3 },
  { label: 'Next week', daysFromToday: 7 },
];
