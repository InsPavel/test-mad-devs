import { WORKDAY_END, WORKDAY_START } from "./constants";
import { timeToMinutes } from "./time";

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
