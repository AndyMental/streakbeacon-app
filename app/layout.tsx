import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";

const title = "StreakBeacon";
const description = "Local-first streak tracking for habits that need visibility.";

export const metadata: Metadata = {
  applicationName: "StreakBeacon",
  title,
  description,
  manifest: "/manifest.webmanifest",
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "StreakBeacon",
    locale: "en_US"
  },
  twitter: {
    card: "summary",
    title,
    description
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1E1E1E" }
  ]
};

import { SkipLink } from "@/components/skip-link";

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SkipLink />
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
