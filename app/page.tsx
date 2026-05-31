import { CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsPanel } from "./settings-panel";
import { SignalsCards } from "./signals-cards";
import { StreakDashboard } from "./streak-dashboard";
import { ThemeToggle } from "./theme-toggle";
import { TodayCards } from "./today-cards";

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10"
    >
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase text-muted-foreground">
            StreakBeacon
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            Local-first streak visibility
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <Badge variant="outline" className="gap-2 text-muted-foreground">
            <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Browser-local settings
          </Badge>
        </div>
      </header>

      <SignalsCards />

      <StreakDashboard />

      <SettingsPanel />

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <TodayCards />

        <Card>
          <CardHeader>
            <CardTitle>Data contract</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              StreakBeacon keeps MVP data in this browser. JSON export/import
              uses a versioned envelope and replaces local data only after
              review.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
