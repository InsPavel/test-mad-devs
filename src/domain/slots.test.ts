import { describe, expect, it } from "vitest";
import { availableEndSlots, availableStartSlots, generateTimeSlots } from "./slots";

describe("generateTimeSlots", () => {
  it("covers workday with 30-minute steps", () => {
    const slots = generateTimeSlots(30);
    expect(slots[0]).toBe("09:00");
    expect(slots.at(-1)).toBe("18:00");
    expect(slots).toContain("13:00");
    expect(slots).toContain("17:30");
  });
});

describe("availableStartSlots", () => {
  const now = new Date(2026, 9, 16, 13, 0, 0); // 2026-10-16 13:00

  it("returns no slots for past dates", () => {
    expect(availableStartSlots("2026-10-15", now)).toEqual([]);
  });

  it("hides starts before now on today", () => {
    const slots = availableStartSlots("2026-10-16", now);
    expect(slots[0]).toBe("13:00");
    expect(slots).not.toContain("12:30");
    expect(slots).not.toContain("09:00");
  });

  it("allows full day for future dates", () => {
    const slots = availableStartSlots("2026-10-17", now);
    expect(slots[0]).toBe("09:00");
    expect(slots.at(-1)).toBe("17:30"); // needs ≥30 min until 18:00
  });
});

describe("availableEndSlots", () => {
  it("keeps duration between 30 minutes and 2 hours", () => {
    expect(availableEndSlots("10:00")).toEqual([
      "10:30",
      "11:00",
      "11:30",
      "12:00",
    ]);
  });

  it("caps by workday end", () => {
    expect(availableEndSlots("17:00")).toEqual(["17:30", "18:00"]);
    expect(availableEndSlots("17:30")).toEqual(["18:00"]);
  });
});
