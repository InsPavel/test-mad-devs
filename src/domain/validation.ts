import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  WORKDAY_END,
  WORKDAY_START,
} from "./constants";
import {
  durationMinutes,
  intervalsOverlap,
  isValidDate,
  isValidTime,
  timeToMinutes,
  toDateString,
  toTimeString,
} from "./time";
import type { Booking, BookingInput, ValidationError, ValidationResult } from "./types";

export type ValidateBookingOptions = {
  existing: Booking[];
  /** When updating, exclude this booking from overlap checks. */
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

function isInThePast(date: string, startTime: string, now: Date): boolean {
  const today = toDateString(now);
  if (date < today) return true;
  if (date > today) return false;
  return timeToMinutes(startTime) < timeToMinutes(toTimeString(now));
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

  const timesOk = isValidTime(input.startTime) && isValidTime(input.endTime);
  if (!timesOk) {
    errors.push({
      code: "INVALID_TIME",
      message: "Время должно быть в формате HH:mm",
      field: "startTime",
    });
  }

  // Structural checks that depend on valid date/time
  if (isValidDate(input.date) && timesOk) {
    if (timeToMinutes(input.endTime) <= timeToMinutes(input.startTime)) {
      errors.push({
        code: "END_BEFORE_START",
        message: "Время окончания должно быть позже начала",
        field: "endTime",
      });
    } else {
      if (!withinWorkday(input.startTime, input.endTime)) {
        errors.push({
          code: "OUTSIDE_WORKDAY",
          message: `Бронь только в рабочее время ${WORKDAY_START}–${WORKDAY_END}`,
          field: "startTime",
        });
      }

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
          message: `Максимальная длительность — ${MAX_DURATION_MINUTES} мин`,
          field: "endTime",
        });
      }
    }

    if (isInThePast(input.date, input.startTime, now)) {
      errors.push({
        code: "IN_THE_PAST",
        message: "Нельзя бронировать прошедшее время",
        field: "startTime",
      });
    }

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
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
