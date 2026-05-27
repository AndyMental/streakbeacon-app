import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreakBeacon",
  description: "Local-first streak tracking for habits that need visibility."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
