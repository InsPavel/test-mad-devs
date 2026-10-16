"use client";

import type { Booking } from "@/domain/types";
import styles from "./BookingList.module.css";

type BookingListProps = {
  bookings: Booking[];
  selectedId: string | null;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
  deletingId: string | null;
};

export function BookingList({
  bookings,
  selectedId,
  onEdit,
  onDelete,
  deletingId,
}: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <p>На эту дату броней нет</p>
        <p className={styles.emptyHint}>Создайте первую через форму справа</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {bookings.map((booking) => {
        const isSelected = booking.id === selectedId;
        const isDeleting = booking.id === deletingId;

        return (
          <li
            key={booking.id}
            className={`${styles.item} ${isSelected ? styles.selected : ""}`}
          >
            <div className={styles.time}>
              {booking.startTime}–{booking.endTime}
            </div>
            <div className={styles.title}>{booking.title}</div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.edit}
                onClick={() => onEdit(booking)}
                disabled={isDeleting}
              >
                Изменить
              </button>
              <button
                type="button"
                className={styles.delete}
                onClick={() => onDelete(booking)}
                disabled={isDeleting}
              >
                {isDeleting ? "Удаление…" : "Удалить"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
