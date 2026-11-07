/**
 * Departure-board dates: "FRI 6 NOV" (with weekday) or "14 OCT", in the device locale's names.
 * Parts are reordered day-before-month so every locale reads like a board; the `board`
 * typography variant uppercases them on screen.
 */
export function formatBoardDate(
  date: Date,
  { weekday = false }: { weekday?: boolean } = {},
): string {
  const parts = new Intl.DateTimeFormat(undefined, {
    ...(weekday ? { weekday: 'short' } : {}),
    day: 'numeric',
    month: 'short',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value.replace(/\.$/, '');
  return [weekday ? part('weekday') : undefined, part('day'), part('month')]
    .filter((value) => value !== undefined)
    .join(' ')
    .toLocaleUpperCase();
}
