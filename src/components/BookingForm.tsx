"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Booking, BookingInput, ValidationError } from "@/domain/types";
import { availableEndSlots, availableStartSlots } from "@/domain/slots";
import { WORKDAY_END, WORKDAY_START } from "@/domain/constants";
import { isPastDate } from "@/domain/time";
import styles from "./BookingForm.module.css";

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

function resolveTimes(
  date: string,
  now: Date,
  initial?: Booking | null,
): { title: string; startTime: string; endTime: string } | null {
  const starts = availableStartSlots(date, now);
  if (starts.length === 0) return null;

  const title = initial?.title ?? "";

  // Prefer current booking times only if they are still available; otherwise first free slot.
  const startTime =
    initial && starts.includes(initial.startTime)
      ? initial.startTime
      : starts[0];

  const ends = availableEndSlots(startTime);
  if (ends.length === 0) return null;

  const endTime =
    initial &&
    initial.startTime === startTime &&
    ends.includes(initial.endTime)
      ? initial.endTime
      : ends[0];

  return { title, startTime, endTime };
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
  const pastDate = isPastDate(date);

  const [nowTick, setNowTick] = useState(() => Date.now());
  const now = useMemo(() => new Date(nowTick), [nowTick]);

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(WORKDAY_START);
  const [endTime, setEndTime] = useState("10:00");
  const [localError, setLocalError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Refresh "now" so past slots disappear while the form stays open.
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Only available times — never inject past slots into the selects.
  const startOptions = useMemo(
    () => availableStartSlots(date, now),
    [date, now],
  );

  const endOptions = useMemo(
    () => (startOptions.includes(startTime) ? availableEndSlots(startTime) : []),
    [startTime, startOptions],
  );

  const editingId = initial?.id ?? null;
  const initialRef = useRef(initial);
  initialRef.current = initial;

  // Re-init only when date / editing target changes — not on list refresh after 409.
  useEffect(() => {
    if (pastDate) {
      setReady(true);
      return;
    }

    const resolved = resolveTimes(date, new Date(), initialRef.current);
    setLocalError(null);

    if (!resolved) {
      setReady(true);
      return;
    }

    setTitle(resolved.title);
    setStartTime(resolved.startTime);
    setEndTime(resolved.endTime);
    setReady(true);
  }, [date, editingId, pastDate]);

  // Keep selection inside the available window as "now" advances.
  useEffect(() => {
    if (pastDate || !ready) return;

    if (startOptions.length === 0) return;

    if (!startOptions.includes(startTime)) {
      const nextStart = startOptions[0];
      setStartTime(nextStart);
      const ends = availableEndSlots(nextStart);
      if (ends[0]) setEndTime(ends[0]);
      return;
    }

    if (endOptions.length > 0 && !endOptions.includes(endTime)) {
      setEndTime(endOptions[0]);
    }
  }, [startOptions, endOptions, startTime, endTime, pastDate, ready]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (pastDate) {
      setLocalError("Нельзя создавать бронь на прошедшую дату");
      return;
    }
    if (!startOptions.includes(startTime)) {
      setLocalError("Выберите доступное время начала");
      return;
    }
    if (!endOptions.includes(endTime)) {
      setLocalError("Выберите доступное время окончания");
      return;
    }
    if (!title.trim()) {
      setLocalError("Укажите название встречи");
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

  if (pastDate) {
    return (
      <div className={styles.form}>
        <h2 className={styles.heading}>{isEdit ? "Бронь" : "Новая бронь"}</h2>
        <p className={styles.meta}>
          Дата: <strong>{date}</strong>
          {initial ? ` · ${initial.startTime}–${initial.endTime}` : null}
        </p>
        {initial && <p className={styles.meta}>{initial.title}</p>}
        <div className={styles.error} role="alert">
          {isEdit
            ? "Прошедшая дата — изменение недоступно"
            : "Создание брони на прошедшую дату недоступно"}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onCancel}>
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  const noSlots = startOptions.length === 0;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>{isEdit ? "Редактировать бронь" : "Новая бронь"}</h2>
      <p className={styles.meta}>
        Дата: <strong>{date}</strong> · окно {WORKDAY_START}–{WORKDAY_END} · 30 мин–2 ч
      </p>

      {noSlots ? (
        <div className={styles.error} role="alert">
          На сегодня больше нет доступных слотов
        </div>
      ) : (
        <>
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
                value={startOptions.includes(startTime) ? startTime : (startOptions[0] ?? "")}
                onChange={(e) => {
                  const next = e.target.value;
                  setStartTime(next);
                  const ends = availableEndSlots(next);
                  setEndTime(ends.includes(endTime) ? endTime : (ends[0] ?? endTime));
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
                value={endOptions.includes(endTime) ? endTime : (endOptions[0] ?? "")}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={submitting || endOptions.length === 0}
              >
                {endOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}

      {(localError || conflictMessage || otherServerMessage) && (
        <div
          className={conflictMessage ? styles.conflict : styles.error}
          role="alert"
        >
          {localError ?? conflictMessage ?? otherServerMessage}
        </div>
      )}

      <div className={styles.actions}>
        {!noSlots && (
          <button type="submit" className={styles.primary} disabled={submitting}>
            {submitting ? "Сохранение…" : isEdit ? "Сохранить" : "Создать"}
          </button>
        )}
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
