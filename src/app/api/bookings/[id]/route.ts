import { NextRequest, NextResponse } from "next/server";
import type { BookingInput } from "@/domain/types";
import { bookingStore } from "@/lib/booking-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const booking = bookingStore.get(id);
  if (!booking) {
    return NextResponse.json({ message: "Не найдено" }, { status: 404 });
  }
  return NextResponse.json(booking);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

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

  const result = bookingStore.update(id, {
    title: input.title,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
  });

  if (!result.ok) {
    if (result.status === 404) {
      return NextResponse.json({ message: "Не найдено" }, { status: 404 });
    }
    return NextResponse.json({ errors: result.errors }, { status: result.status });
  }

  return NextResponse.json(result.booking);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const deleted = bookingStore.delete(id);
  if (!deleted) {
    return NextResponse.json({ message: "Не найдено" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
