import type { Booking, BookingInput, ValidationError } from "@/domain/types";
import { validateBooking } from "@/domain/validation";

type CreateResult =
  | { ok: true; booking: Booking }
  | { ok: false; status: 400 | 409; errors: ValidationError[] };

type UpdateResult =
  | { ok: true; booking: Booking }
  | { ok: false; status: 400 | 404 | 409; errors?: ValidationError[] };

/**
 * In-memory mock store for Route Handlers.
 * Survives across requests in the same Node process (dev / single instance).
 */
class BookingStore {
  private bookings = new Map<string, Booking>();

  list(date?: string): Booking[] {
    const all = Array.from(this.bookings.values());
    const filtered = date ? all.filter((b) => b.date === date) : all;
    return filtered.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }

  get(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  create(input: BookingInput): CreateResult {
    const result = validateBooking(input, { existing: this.list() });
    if (!result.ok) {
      const isConflict = result.errors.some((e) => e.code === "OVERLAP");
      return { ok: false, status: isConflict ? 409 : 400, errors: result.errors };
    }

    const now = new Date().toISOString();
    const booking: Booking = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      createdAt: now,
      updatedAt: now,
    };
    this.bookings.set(booking.id, booking);
    return { ok: true, booking };
  }

  update(id: string, input: BookingInput): UpdateResult {
    const existing = this.bookings.get(id);
    if (!existing) {
      return { ok: false, status: 404 };
    }

    const result = validateBooking(input, {
      existing: this.list(),
      excludeId: id,
    });
    if (!result.ok) {
      const isConflict = result.errors.some((e) => e.code === "OVERLAP");
      return { ok: false, status: isConflict ? 409 : 400, errors: result.errors };
    }

    const booking: Booking = {
      ...existing,
      title: input.title.trim(),
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      updatedAt: new Date().toISOString(),
    };
    this.bookings.set(id, booking);
    return { ok: true, booking };
  }

  delete(id: string): boolean {
    return this.bookings.delete(id);
  }
}

const globalForStore = globalThis as unknown as { __bookingStore?: BookingStore };

export const bookingStore = globalForStore.__bookingStore ?? new BookingStore();

if (process.env.NODE_ENV !== "production") {
  globalForStore.__bookingStore = bookingStore;
}
