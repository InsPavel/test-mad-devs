const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Minutes since midnight for HH:mm. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function durationMinutes(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

/**
 * Half-open intervals [start, end).
 * Touching boundaries do NOT overlap: 10:00–11:00 and 11:00–12:00 are allowed.
 */
export function intervalsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(bStart) < timeToMinutes(aEnd)
  );
}

/** Local calendar date as YYYY-MM-DD. */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local time as HH:mm. */
export function toTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function isPastDate(date: string, now: Date = new Date()): boolean {
  return date < toDateString(now);
}

export function isFutureDate(date: string, now: Date = new Date()): boolean {
  return date > toDateString(now);
}

export function isToday(date: string, now: Date = new Date()): boolean {
  return date === toDateString(now);
}

/** True when the booking start is before "now" on the same calendar day, or the date is past. */
export function isStartInThePast(
  date: string,
  startTime: string,
  now: Date = new Date(),
): boolean {
  if (isPastDate(date, now)) return true;
  if (isFutureDate(date, now)) return false;
  return timeToMinutes(startTime) < timeToMinutes(toTimeString(now));
}
