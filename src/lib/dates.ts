import { z } from 'zod';

/** Calendar date without time, `YYYY-MM-DD`, interpreted in the device's local time zone. */
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD');
export type IsoDate = z.infer<typeof IsoDateSchema>;

/** A Next Step is urgent when due within this many hours, or overdue. */
export const URGENT_WINDOW_HOURS = 48;

export function toIsoDate(date: Date): IsoDate {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** End of the due day in local time: a step due "today" stays due until midnight. */
export function endOfDueDate(date: IsoDate): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, 23, 59, 59, 999);
}

export function isUrgent(dueDate: IsoDate, now: Date): boolean {
  const msUntilDue = endOfDueDate(dueDate).getTime() - now.getTime();
  return msUntilDue <= URGENT_WINDOW_HOURS * 60 * 60 * 1000;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** "Today", "Tomorrow", "Overdue · Mar 3", or "Fri, Mar 7". */
export function formatDueDate(dueDate: IsoDate, now: Date): string {
  const due = endOfDueDate(dueDate);
  const today = toIsoDate(now);
  if (dueDate === today) return 'Today';
  if (dueDate === toIsoDate(addDays(now, 1))) return 'Tomorrow';
  const label = due.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return due.getTime() < now.getTime() ? `Overdue · ${label}` : label;
}
