import { describe, expect, it } from "vitest";
import type { Booking, BookingInput } from "./types";
import { validateBooking } from "./validation";

const now = new Date(2026, 9, 16, 13, 0, 0); // local 2026-10-16 13:00

function booking(partial: Partial<Booking> & Pick<Booking, "id" | "startTime" | "endTime">): Booking {
  return {
    title: "Existing",
    date: "2026-10-16",
    createdAt: "2026-10-16T00:00:00.000Z",
    updatedAt: "2026-10-16T00:00:00.000Z",
    ...partial,
  };
}

function input(overrides: Partial<BookingInput> = {}): BookingInput {
  return {
    title: "Sync",
    date: "2026-10-16",
    startTime: "14:00",
    endTime: "15:00",
    ...overrides,
  };
}

function codes(result: ReturnType<typeof validateBooking>): string[] {
  return result.ok ? [] : result.errors.map((e) => e.code);
}

describe("validateBooking", () => {
  it("accepts a valid future slot today", () => {
    expect(validateBooking(input(), { existing: [], now }).ok).toBe(true);
  });

  it("requires title", () => {
    const result = validateBooking(input({ title: "   " }), { existing: [], now });
    expect(codes(result)).toContain("TITLE_REQUIRED");
  });

  it("rejects invalid date / time", () => {
    expect(codes(validateBooking(input({ date: "2026-02-30" }), { existing: [], now }))).toContain(
      "INVALID_DATE",
    );
    expect(
      codes(validateBooking(input({ startTime: "25:00" }), { existing: [], now })),
    ).toContain("INVALID_TIME");
  });

  it("rejects past dates", () => {
    const result = validateBooking(input({ date: "2026-10-15" }), { existing: [], now });
    expect(codes(result)).toEqual(["PAST_DATE"]);
  });

  it("requires start < end", () => {
    const result = validateBooking(
      input({ startTime: "15:00", endTime: "14:00" }),
      { existing: [], now },
    );
    expect(codes(result)).toContain("END_BEFORE_START");
  });

  it("enforces workday 09:00–18:00", () => {
    const early = validateBooking(
      input({ startTime: "08:00", endTime: "09:00" }),
      { existing: [], now },
    );
    expect(codes(early)).toContain("OUTSIDE_WORKDAY");

    const late = validateBooking(
      input({ startTime: "17:30", endTime: "18:30" }),
      { existing: [], now },
    );
    expect(codes(late)).toContain("OUTSIDE_WORKDAY");
  });

  it("enforces min 30 minutes and max 2 hours", () => {
    const tooShort = validateBooking(
      input({ startTime: "14:00", endTime: "14:15" }),
      { existing: [], now },
    );
    expect(codes(tooShort)).toContain("DURATION_TOO_SHORT");

    const tooLong = validateBooking(
      input({ startTime: "14:00", endTime: "16:30" }),
      { existing: [], now },
    );
    expect(codes(tooLong)).toContain("DURATION_TOO_LONG");

    const maxOk = validateBooking(
      input({ startTime: "14:00", endTime: "16:00" }),
      { existing: [], now },
    );
    expect(maxOk.ok).toBe(true);
  });

  it("rejects past start times on today", () => {
    const result = validateBooking(
      input({ startTime: "12:00", endTime: "13:00" }),
      { existing: [], now },
    );
    expect(codes(result)).toContain("IN_THE_PAST");
  });

  it("detects overlaps but allows touching boundaries", () => {
    const existing = [
      booking({ id: "a", startTime: "14:00", endTime: "15:00", title: "A" }),
    ];

    const overlap = validateBooking(
      input({ startTime: "14:30", endTime: "15:30" }),
      { existing, now },
    );
    expect(codes(overlap)).toContain("OVERLAP");

    const touching = validateBooking(
      input({ startTime: "15:00", endTime: "16:00" }),
      { existing, now },
    );
    expect(touching.ok).toBe(true);
  });

  it("excludes current booking id on edit", () => {
    const existing = [
      booking({ id: "self", startTime: "14:00", endTime: "15:00", title: "Self" }),
      booking({ id: "other", startTime: "16:00", endTime: "17:00", title: "Other" }),
    ];

    const sameSlot = validateBooking(
      input({ startTime: "14:00", endTime: "15:00", title: "Self updated" }),
      { existing, excludeId: "self", now },
    );
    expect(sameSlot.ok).toBe(true);

    const hitsOther = validateBooking(
      input({ startTime: "15:30", endTime: "16:30" }),
      { existing, excludeId: "self", now },
    );
    expect(codes(hitsOther)).toContain("OVERLAP");
  });

  it("allows booking on a future date even for early morning", () => {
    const result = validateBooking(
      input({ date: "2026-10-17", startTime: "09:00", endTime: "09:30" }),
      { existing: [], now },
    );
    expect(result.ok).toBe(true);
  });
});
