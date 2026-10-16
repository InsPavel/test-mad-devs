"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, bookingsApi } from "@/api/client";
import type { Booking, ValidationError } from "@/domain/types";
import { isPastDate, toDateString } from "@/domain/time";
import { BookingForm, type BookingFormValues } from "./BookingForm";
import { BookingList } from "./BookingList";
import styles from "./BookingApp.module.css";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; bookings: Booking[] };

export function BookingApp() {
  const [date, setDate] = useState<string | null>(null);
  const [listState, setListState] = useState<ListState>({ status: "loading" });
  const [editing, setEditing] = useState<Booking | null>(null);
  const [formOpen, setFormOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<ValidationError[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (selectedDate: string) => {
    setListState({ status: "loading" });
    try {
      const bookings = await bookingsApi.list(selectedDate);
      setListState({ status: "ready", bookings });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Не удалось загрузить брони";
      setListState({ status: "error", message });
    }
  }, []);

  useEffect(() => {
    setDate(toDateString(new Date()));
  }, []);

  useEffect(() => {
    if (!date) return;
    void load(date);
  }, [date, load]);

  function openCreate() {
    setEditing(null);
    setServerErrors(null);
    setFormOpen(true);
  }

  function openEdit(booking: Booking) {
    setEditing(booking);
    setServerErrors(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setServerErrors(null);
  }

  async function handleSubmit(values: BookingFormValues) {
    setSubmitting(true);
    setServerErrors(null);
    try {
      if (editing) {
        await bookingsApi.update(editing.id, values);
      } else {
        await bookingsApi.create(values);
      }
      // Success: clear form and refresh. Values are discarded only after OK.
      setEditing(null);
      setServerErrors(null);
      setFormOpen(false);
      await load(values.date);
    } catch (err) {
      if (err instanceof ApiError) {
        // On 409 (and other validation errors) keep the form and values as-is.
        setServerErrors(err.errors ?? [{ code: "OVERLAP", message: err.message }]);
        setFormOpen(true);
      } else {
        setServerErrors([
          { code: "UNKNOWN", message: "Неизвестная ошибка при сохранении" },
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(booking: Booking) {
    if (!date) return;
    if (!window.confirm(`Удалить бронь «${booking.title}»?`)) return;
    setDeletingId(booking.id);
    try {
      await bookingsApi.remove(booking.id);
      if (editing?.id === booking.id) {
        closeForm();
      }
      await load(date);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Не удалось удалить";
      alert(message);
    } finally {
      setDeletingId(null);
    }
  }

  if (!date) {
    return (
      <div className={styles.app}>
        <div className={styles.state} role="status">
          Загрузка…
        </div>
      </div>
    );
  }

  const dateIsPast = isPastDate(date);
  const canCreate = !dateIsPast;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Переговорка</h1>
          <p className={styles.subtitle}>
            Рабочий день 09:00–18:00 · длительность 30 мин–2 ч
          </p>
        </div>
        <label className={styles.dateField}>
          <span>Дата</span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              closeForm();
              setFormOpen(true);
            }}
          />
        </label>
      </header>

      <div className={styles.layout}>
        <section className={styles.listSection} aria-live="polite">
          <div className={styles.sectionHead}>
            <h2>Брони на {date}</h2>
            {!formOpen && canCreate && (
              <button type="button" className={styles.newBtn} onClick={openCreate}>
                + Новая
              </button>
            )}
          </div>

          {listState.status === "loading" && (
            <div className={styles.state} role="status">
              Загрузка…
            </div>
          )}

          {listState.status === "error" && (
            <div className={styles.errorState} role="alert">
              <p>{listState.message}</p>
              <button type="button" onClick={() => void load(date)}>
                Повторить
              </button>
            </div>
          )}

          {listState.status === "ready" && (
            <BookingList
              bookings={listState.bookings}
              selectedId={editing?.id ?? null}
              onEdit={openEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          )}
        </section>

        <aside className={styles.formSection}>
          {formOpen ? (
            <BookingForm
              key={editing?.id ?? `create-${date}`}
              date={date}
              initial={editing}
              submitting={submitting}
              serverErrors={serverErrors}
              onSubmit={handleSubmit}
              onCancel={closeForm}
            />
          ) : (
            <div className={styles.formPlaceholder}>
              <p>
                {dateIsPast
                  ? "Прошедшая дата — создание брони недоступно"
                  : "Выберите бронь для редактирования или создайте новую"}
              </p>
              {canCreate && (
                <button type="button" className={styles.newBtn} onClick={openCreate}>
                  + Новая бронь
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
