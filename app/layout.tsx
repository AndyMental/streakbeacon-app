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
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            data-testid="skip-link"
          >
            Skip to main content
          </a>
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
