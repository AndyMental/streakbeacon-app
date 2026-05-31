"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({
  error,
  reset
}: GlobalErrorPageProps) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-beacon focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-hidden focus:ring-2 focus:ring-sky focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <main
          id="main-content"
          role="alert"
          aria-live="assertive"
          className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground"
        >
          <Card className="w-full max-w-md">
            <CardHeader className="gap-3 border-b">
              <p className="text-sm font-medium uppercase text-muted-foreground">
                StreakBeacon
              </p>
              <CardTitle className="text-2xl leading-tight sm:text-3xl">
                Signal interrupted
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <p className="text-sm leading-6 text-muted-foreground">
                StreakBeacon hit a page-level failure. Try again to reload the
                app shell and return to your local streak map.
              </p>
              {error.digest ? (
                <p className="text-xs font-medium text-secondary-foreground">
                  Error reference: {error.digest}
                </p>
              ) : null}
              <Button type="button" data-testid="error-reset" onClick={reset}>
                Try again
              </Button>
            </CardContent>
          </Card>
        </main>
      </body>
    </html>
  );
}
