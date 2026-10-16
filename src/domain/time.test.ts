import { describe, expect, it } from "vitest";
import {
  durationMinutes,
  intervalsOverlap,
  isPastDate,
  isStartInThePast,
  isToday,
  isValidDate,
  isValidTime,
  timeToMinutes,
  toDateString,
} from "./time";

describe("isValidTime", () => {
  it("accepts HH:mm", () => {
    expect(isValidTime("09:00")).toBe(true);
    expect(isValidTime("18:00")).toBe(true);
    expect(isValidTime("00:00")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(isValidTime("9:00")).toBe(false);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("12:60")).toBe(false);
    expect(isValidTime("")).toBe(false);
  });
});

describe("isValidDate", () => {
  it("accepts real calendar dates", () => {
    expect(isValidDate("2026-10-16")).toBe(true);
    expect(isValidDate("2024-02-29")).toBe(true);
  });

  it("rejects impossible dates", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("16-10-2026")).toBe(false);
  });
});

describe("timeToMinutes / durationMinutes", () => {
  it("converts and measures duration", () => {
    expect(timeToMinutes("09:00")).toBe(540);
    expect(timeToMinutes("10:30")).toBe(630);
    expect(durationMinutes("10:00", "11:30")).toBe(90);
  });
});

describe("intervalsOverlap", () => {
  it("detects overlapping intervals", () => {
    expect(intervalsOverlap("10:00", "11:00", "10:30", "11:30")).toBe(true);
    expect(intervalsOverlap("10:00", "12:00", "10:00", "12:00")).toBe(true);
    expect(intervalsOverlap("10:00", "11:00", "10:00", "10:30")).toBe(true);
  });

  it("allows touching boundaries (half-open)", () => {
    expect(intervalsOverlap("10:00", "11:00", "11:00", "12:00")).toBe(false);
    expect(intervalsOverlap("11:00", "12:00", "10:00", "11:00")).toBe(false);
  });

  it("returns false for disjoint intervals", () => {
    expect(intervalsOverlap("09:00", "10:00", "11:00", "12:00")).toBe(false);
  });
});

describe("past helpers", () => {
  const now = new Date(2026, 9, 16, 13, 0, 0); // local 2026-10-16 13:00

  it("isPastDate / isToday", () => {
    expect(isPastDate("2026-10-15", now)).toBe(true);
    expect(isPastDate("2026-10-16", now)).toBe(false);
    expect(isToday("2026-10-16", now)).toBe(true);
  });

  it("isStartInThePast for today slots", () => {
    expect(isStartInThePast("2026-10-16", "12:30", now)).toBe(true);
    expect(isStartInThePast("2026-10-16", "13:00", now)).toBe(false);
    expect(isStartInThePast("2026-10-16", "14:00", now)).toBe(false);
  });

  it("treats whole past dates as past starts", () => {
    expect(isStartInThePast("2026-10-15", "17:00", now)).toBe(true);
  });

  it("future dates are never past starts", () => {
    expect(isStartInThePast("2026-10-17", "09:00", now)).toBe(false);
  });

  it("toDateString matches local calendar day", () => {
    expect(toDateString(now)).toBe("2026-10-16");
  });
});
