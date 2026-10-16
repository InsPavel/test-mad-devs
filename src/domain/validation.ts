import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  WORKDAY_END,
  WORKDAY_START,
} from "./constants";
import {
  durationMinutes,
  intervalsOverlap,
  isPastDate,
  isStartInThePast,
  isValidDate,
  isValidTime,
  timeToMinutes,
} from "./time";
import type { Booking, BookingInput, ValidationError, ValidationResult } from "./types";

export type ValidateBookingOptions = {
  existing: Booking[];
  /** When updating, this booking is ignored in overlap checks. */
  excludeId?: string;
  /** Clock used for "past" checks; injectable for tests. */
  now?: Date;
};

function withinWorkday(startTime: string, endTime: string): boolean {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const workStart = timeToMinutes(WORKDAY_START);
  const workEnd = timeToMinutes(WORKDAY_END);
  return start >= workStart && end <= workEnd;
}

export function validateBooking(
  input: BookingInput,
  options: ValidateBookingOptions,
): ValidationResult {
  const errors: ValidationError[] = [];
  const now = options.now ?? new Date();
  const title = input.title.trim();

  if (!title) {
    errors.push({
      code: "TITLE_REQUIRED",
      message: "Укажите название встречи",
      field: "title",
    });
  }

  if (!isValidDate(input.date)) {
    errors.push({
      code: "INVALID_DATE",
      message: "Некорректная дата",
      field: "date",
    });
  }

  const startOk = isValidTime(input.startTime);
  const endOk = isValidTime(input.endTime);
  if (!startOk || !endOk) {
    errors.push({
      code: "INVALID_TIME",
      message: "Время должно быть в формате HH:mm",
      field: !startOk ? "startTime" : "endTime",
    });
  }

  if (!isValidDate(input.date) || !startOk || !endOk) {
    return { ok: false, errors };
  }

  // 5. Past dates: creating/updating a booking is not allowed.
  if (isPastDate(input.date, now)) {
    errors.push({
      code: "PAST_DATE",
      message: "Нельзя создавать бронь на прошедшую дату",
      field: "date",
    });
    return { ok: false, errors };
  }

  // 2. start < end
  if (timeToMinutes(input.endTime) <= timeToMinutes(input.startTime)) {
    errors.push({
      code: "END_BEFORE_START",
      message: "Время начала должно быть раньше окончания",
      field: "endTime",
    });
    return { ok: false, errors };
  }

  // 1. Working day 09:00–18:00
  if (!withinWorkday(input.startTime, input.endTime)) {
    errors.push({
      code: "OUTSIDE_WORKDAY",
      message: `Бронь только в рабочее время ${WORKDAY_START}–${WORKDAY_END}`,
      field: "startTime",
    });
  }

  // 3. min 30 minutes, max 2 hours
  const duration = durationMinutes(input.startTime, input.endTime);
  if (duration < MIN_DURATION_MINUTES) {
    errors.push({
      code: "DURATION_TOO_SHORT",
      message: `Минимальная длительность — ${MIN_DURATION_MINUTES} мин`,
      field: "endTime",
    });
  }
  if (duration > MAX_DURATION_MINUTES) {
    errors.push({
      code: "DURATION_TOO_LONG",
      message: `Максимальная длительность — ${MAX_DURATION_MINUTES / 60} ч`,
      field: "endTime",
    });
  }

  // 5. Today: past start slots are not allowed.
  if (isStartInThePast(input.date, input.startTime, now)) {
    errors.push({
      code: "IN_THE_PAST",
      message: "Нельзя бронировать прошедшее время",
      field: "startTime",
    });
  }

  // 4. Overlap (touching boundaries allowed); 6. excludeId on edit
  const conflict = options.existing.find(
    (b) =>
      b.id !== options.excludeId &&
      b.date === input.date &&
      intervalsOverlap(input.startTime, input.endTime, b.startTime, b.endTime),
  );

  if (conflict) {
    errors.push({
      code: "OVERLAP",
      message: `Пересечение с бронью «${conflict.title}» (${conflict.startTime}–${conflict.endTime})`,
      field: "startTime",
    });
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
