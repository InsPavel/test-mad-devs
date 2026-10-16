import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Переговорка — бронирование",
  description: "Бронирование переговорной комнаты на рабочий день 09:00–18:00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
