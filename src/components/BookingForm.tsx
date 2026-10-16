"use client";

import { useEffect, useState } from "react";
import type { Booking, BookingInput, ValidationError } from "@/domain/types";
import { generateTimeSlots } from "@/domain/slots";
import { WORKDAY_END, WORKDAY_START } from "@/domain/constants";
import styles from "./BookingForm.module.css";

const TIME_SLOTS = generateTimeSlots(30);

export type BookingFormValues = BookingInput;

type BookingFormProps = {
  date: string;
  initial?: Booking | null;
  submitting: boolean;
  serverErrors: ValidationError[] | null;
  onSubmit: (values: BookingFormValues) => void;
  onCancel: () => void;
};

function fieldError(
  errors: ValidationError[] | null,
  field: keyof BookingInput,
): string | undefined {
  return errors?.find((e) => e.field === field)?.message;
}

export function BookingForm({
  date,
  initial,
  submitting,
  serverErrors,
  onSubmit,
  onCancel,
}: BookingFormProps) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? WORKDAY_START);
  const [endTime, setEndTime] = useState(initial?.endTime ?? "10:00");
  const [localError, setLocalError] = useState<string | null>(null);

  // Keep form values when switching into edit or after a 409 (parent keeps `initial`/values).
  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setStartTime(initial.startTime);
      setEndTime(initial.endTime);
    } else {
      setTitle("");
      setStartTime(WORKDAY_START);
      setEndTime("10:00");
    }
    setLocalError(null);
  }, [initial]);

  const startOptions = TIME_SLOTS.filter((t) => t < WORKDAY_END);
  const endOptions = TIME_SLOTS.filter((t) => t > startTime);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!title.trim()) {
      setLocalError("Укажите название встречи");
      return;
    }
    if (endTime <= startTime) {
      setLocalError("Время окончания должно быть позже начала");
      return;
    }

    onSubmit({
      title: title.trim(),
      date,
      startTime,
      endTime,
    });
  }

  const conflictMessage = serverErrors?.find((e) => e.code === "OVERLAP")?.message;
  const otherServerMessage = serverErrors
    ?.filter((e) => e.code !== "OVERLAP")
    .map((e) => e.message)
    .join(". ");

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>{isEdit ? "Редактировать бронь" : "Новая бронь"}</h2>
      <p className={styles.meta}>
        Дата: <strong>{date}</strong> · окно {WORKDAY_START}–{WORKDAY_END}
      </p>

      <label className={styles.field}>
        <span>Название</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
          placeholder="Синк по проекту"
          autoFocus
        />
        {fieldError(serverErrors, "title") && (
          <span className={styles.fieldError}>{fieldError(serverErrors, "title")}</span>
        )}
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Начало</span>
          <select
            value={startTime}
            onChange={(e) => {
              const next = e.target.value;
              setStartTime(next);
              if (endTime <= next) {
                const nextEnd = TIME_SLOTS.find((t) => t > next);
                if (nextEnd) setEndTime(nextEnd);
              }
            }}
            disabled={submitting}
          >
            {startOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Окончание</span>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={submitting}
          >
            {endOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(localError || conflictMessage || otherServerMessage) && (
        <div
          className={conflictMessage ? styles.conflict : styles.error}
          role="alert"
        >
          {localError ?? conflictMessage ?? otherServerMessage}
        </div>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.primary} disabled={submitting}>
          {submitting ? "Сохранение…" : isEdit ? "Сохранить" : "Создать"}
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={onCancel}
          disabled={submitting}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
