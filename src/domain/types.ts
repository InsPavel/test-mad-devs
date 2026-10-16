export type Booking = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  createdAt: string;
  updatedAt: string;
};

export type BookingInput = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type ValidationErrorCode =
  | "TITLE_REQUIRED"
  | "INVALID_DATE"
  | "INVALID_TIME"
  | "OUTSIDE_WORKDAY"
  | "END_BEFORE_START"
  | "DURATION_TOO_SHORT"
  | "DURATION_TOO_LONG"
  | "PAST_DATE"
  | "IN_THE_PAST"
  | "OVERLAP"
  | "UNKNOWN";

export type ValidationError = {
  code: ValidationErrorCode;
  message: string;
  field?: keyof BookingInput;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] };
