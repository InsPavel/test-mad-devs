import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  WORKDAY_END,
  WORKDAY_START,
} from "./constants";
import {
  durationMinutes,
  isPastDate,
  isStartInThePast,
  isToday,
  timeToMinutes,
} from "./time";

/** Generate HH:mm slots every `stepMinutes` within the workday. */
export function generateTimeSlots(stepMinutes = 30): string[] {
  const start = timeToMinutes(WORKDAY_START);
  const end = timeToMinutes(WORKDAY_END);
  const slots: string[] = [];

  for (let m = start; m <= end; m += stepMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }

  return slots;
}

/**
 * Start slots available for booking on `date`.
 * Past dates → none. Today → only starts that are not in the past.
 * Latest start must still allow at least MIN_DURATION before WORKDAY_END.
 */
export function availableStartSlots(
  date: string,
  now: Date = new Date(),
  stepMinutes = 30,
): string[] {
  if (isPastDate(date, now)) return [];

  const slots = generateTimeSlots(stepMinutes);
  const latestStartMinutes =
    timeToMinutes(WORKDAY_END) - MIN_DURATION_MINUTES;

  return slots.filter((start) => {
    if (timeToMinutes(start) > latestStartMinutes) return false;
    if (isToday(date, now) && isStartInThePast(date, start, now)) return false;
    return true;
  });
}

/**
 * End slots for a chosen start: start < end, duration in [min, max], within workday.
 */
export function availableEndSlots(
  startTime: string,
  stepMinutes = 30,
): string[] {
  const slots = generateTimeSlots(stepMinutes);
  return slots.filter((end) => {
    const duration = durationMinutes(startTime, end);
    return (
      duration >= MIN_DURATION_MINUTES && duration <= MAX_DURATION_MINUTES
    );
  });
}
