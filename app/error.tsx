"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
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
            Signal dropped
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Something interrupted your streak map. Try again to reload the
            current view and keep today&apos;s plan moving.
          </p>
          {error.digest ? (
            <p className="text-xs font-medium text-secondary-foreground">
              Error reference: {error.digest}
            </p>
          ) : null}
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
