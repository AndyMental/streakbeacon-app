import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { getBaseUrl } from "@/lib/metadata";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";

const title = "StreakBeacon";
const description = "Local-first streak tracking for habits that need visibility.";
const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  applicationName: "StreakBeacon",
  title,
  description,
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "StreakBeacon",
    locale: "en_US",
    url: "/"
  },
  twitter: {
    card: "summary",
    title,
    description
  },
  robots: {
    index: true,
    follow: true
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: title,
    description: description,
    url: baseUrl,
    applicationCategory: "Productivity",
    operatingSystem: "All"
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
