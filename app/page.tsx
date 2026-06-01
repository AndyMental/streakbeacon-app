import { CalendarCheck, Flame, ShieldCheck, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsPanel } from "./settings-panel";
import { StreakDashboard } from "./streak-dashboard";
import { ThemeToggle } from "./theme-toggle";

const habits = [
  { name: "Morning walk", streak: "12 days", status: "Done today" },
  { name: "Ship one useful change", streak: "5 days", status: "Queued" },
  { name: "Evening shutdown", streak: "8 days", status: "Due tonight" }
];

const signals = [
  { label: "Export format", value: "v1", icon: ShieldCheck },
  { label: "Storage", value: "Local", icon: Flame },
  { label: "Grid window", value: "365", icon: Target }
];

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

      <section className="grid gap-4 sm:grid-cols-3">
        {signals.map((signal) => {
          const Icon = signal.icon;

          return (
            <Card key={signal.label}>
              <CardContent className="pt-4">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm text-muted-foreground">
                    {signal.label}
                  </p>
                  <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                </div>
                <p className="mt-3 truncate text-2xl font-semibold">
                  {signal.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <StreakDashboard />

      <SettingsPanel />

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader className="border-b py-3">
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <div className="divide-y">
            {habits.map((habit) => (
              <div
                key={habit.name}
                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{habit.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {habit.streak}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="max-w-full shrink-0 truncate sm:max-w-[12rem]"
                >
                  {habit.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader className="border-b py-3">
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
