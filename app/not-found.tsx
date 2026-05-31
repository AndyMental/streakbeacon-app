import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="gap-3 border-b">
          <p className="text-sm font-medium uppercase text-muted-foreground">
            StreakBeacon
          </p>
          <CardTitle className="text-2xl leading-tight sm:text-3xl">
            Page not found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <p className="text-sm leading-6 text-muted-foreground">
            This route is not part of your current streak map. Head back home to
            review today&apos;s plan and keep the signal clear.
          </p>
          <Button asChild>
            <Link href="/" data-testid="not-found-home-link">
              Back to home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
