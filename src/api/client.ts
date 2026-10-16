import type { Booking, BookingInput, ValidationError } from "@/domain/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: ValidationError[],
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isConflict(): boolean {
    return this.status === 409;
  }
}

async function parseJson<T>(response: Response): Promise<T | undefined> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  return JSON.parse(text) as T;
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await parseJson<{ errors?: ValidationError[]; message?: string }>(
      response,
    );
    throw new ApiError(
      body?.message ?? body?.errors?.[0]?.message ?? `HTTP ${response.status}`,
      response.status,
      body?.errors,
    );
  }

  return (await parseJson<T>(response)) as T;
}

export const bookingsApi = {
  list(date: string): Promise<Booking[]> {
    const params = new URLSearchParams({ date });
    return request<Booking[]>(`/api/bookings?${params}`);
  },

  get(id: string): Promise<Booking> {
    return request<Booking>(`/api/bookings/${id}`);
  },

  create(input: BookingInput): Promise<Booking> {
    return request<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: BookingInput): Promise<Booking> {
    return request<Booking>(`/api/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  remove(id: string): Promise<void> {
    return request<void>(`/api/bookings/${id}`, { method: "DELETE" });
  },
};
