import { NextRequest, NextResponse } from "next/server";
import type { BookingInput } from "@/domain/types";
import { bookingStore } from "@/lib/booking-store";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? undefined;
  const bookings = bookingStore.list(date ?? undefined);
  return NextResponse.json(bookings);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: [{ code: "INVALID_BODY", message: "Ожидался JSON" }] },
      { status: 400 },
    );
  }

  const input = body as Partial<BookingInput>;
  if (
    typeof input.title !== "string" ||
    typeof input.date !== "string" ||
    typeof input.startTime !== "string" ||
    typeof input.endTime !== "string"
  ) {
    return NextResponse.json(
      {
        errors: [
          {
            code: "INVALID_BODY",
            message: "Нужны поля title, date, startTime, endTime",
          },
        ],
      },
      { status: 400 },
    );
  }

  const result = bookingStore.create({
    title: input.title,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
  });

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: result.status });
  }

  return NextResponse.json(result.booking, { status: 201 });
}
