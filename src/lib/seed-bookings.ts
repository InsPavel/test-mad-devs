import type { Booking } from "@/domain/types";
import { toDateString } from "@/domain/time";

function shiftDate(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

type SeedDraft = {
  id: string;
  title: string;
  /** Days relative to today: negative = past, 0 = today, positive = future. */
  dayOffset: number;
  startTime: string;
  endTime: string;
};

/**
 * Demo bookings across past / today / future with 30m–2h durations.
 * Inserted directly into the store (bypasses validation) so past dates exist.
 */
const SEED_DRAFTS: SeedDraft[] = [
  // Past days
  {
    id: "seed-past-3-standup",
    title: "Стендап команды",
    dayOffset: -3,
    startTime: "09:00",
    endTime: "09:30",
  },
  {
    id: "seed-past-3-design",
    title: "Дизайн-ревью",
    dayOffset: -3,
    startTime: "11:00",
    endTime: "12:30",
  },
  {
    id: "seed-past-2-client",
    title: "Созвон с клиентом",
    dayOffset: -2,
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: "seed-past-2-planning",
    title: "Планирование спринта",
    dayOffset: -2,
    startTime: "14:00",
    endTime: "16:00",
  },
  {
    id: "seed-past-1-interview",
    title: "Собеседование",
    dayOffset: -1,
    startTime: "09:30",
    endTime: "10:30",
  },
  {
    id: "seed-past-1-retro",
    title: "Ретроспектива",
    dayOffset: -1,
    startTime: "16:00",
    endTime: "17:30",
  },
  // Today — morning / midday / late (some may already be "past" depending on clock)
  {
    id: "seed-today-morning",
    title: "Утренний синк",
    dayOffset: 0,
    startTime: "09:00",
    endTime: "09:30",
  },
  {
    id: "seed-today-mid",
    title: "Демо продукта",
    dayOffset: 0,
    startTime: "12:00",
    endTime: "13:00",
  },
  {
    id: "seed-today-touching-a",
    title: "Согласование ТЗ",
    dayOffset: 0,
    startTime: "15:00",
    endTime: "16:00",
  },
  {
    id: "seed-today-touching-b",
    title: "Код-ревью",
    dayOffset: 0,
    startTime: "16:00",
    endTime: "17:00",
  },
  // Future
  {
    id: "seed-future-1-onboarding",
    title: "Онбординг новичка",
    dayOffset: 1,
    startTime: "10:00",
    endTime: "11:30",
  },
  {
    id: "seed-future-1-arch",
    title: "Архитектурный разбор",
    dayOffset: 1,
    startTime: "14:30",
    endTime: "16:30",
  },
  {
    id: "seed-future-2-workshop",
    title: "Воркшоп по API",
    dayOffset: 2,
    startTime: "09:00",
    endTime: "11:00",
  },
  {
    id: "seed-future-5-allhands",
    title: "All-hands",
    dayOffset: 5,
    startTime: "11:00",
    endTime: "12:00",
  },
];

export function buildSeedBookings(now: Date = new Date()): Booking[] {
  const iso = now.toISOString();

  return SEED_DRAFTS.map((draft) => ({
    id: draft.id,
    title: draft.title,
    date: shiftDate(now, draft.dayOffset),
    startTime: draft.startTime,
    endTime: draft.endTime,
    createdAt: iso,
    updatedAt: iso,
  }));
}
