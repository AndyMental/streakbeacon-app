"use client";

import { CalendarCheck, Flame, ShieldCheck, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsPanel } from "./settings-panel";
import { StreakDashboard } from "./streak-dashboard";
import { ThemeToggle } from "./theme-toggle";
import { useStreakData } from "@/lib/streaks/use-streak-data";
import {
  calculateCurrentStreak,
  STREAK_DATA_VERSION,
  type IsoDate
} from "@/lib/streaks/model";

export default function Home() {
  const { data, isReady } = useStreakData();

  const today = new Date().toISOString().slice(0, 10) as IsoDate;

  const signals = [
    {
      label: "Export format",
      value: `v${data.schemaVersion || STREAK_DATA_VERSION}`,
      icon: ShieldCheck
    },
    {
      label: "Storage",
      value: "Local",
      icon: Flame
    },
    {
      label: "Grid window",
      value: data.preferences.gridWindowDays.toString(),
      icon: Target
    }
  ];

  const habits = data.items
    .filter(item => !item.archivedAt)
    .sort((a, b) => a.order - b.order)
    .map(item => {
      const completions = data.completions[item.id] || {};
      const streak = calculateCurrentStreak(completions, today);
      const isDoneToday = !!completions[today];

      return {
        name: item.name,
        streak: `${streak} day${streak === 1 ? "" : "s"}`,
        status: isDoneToday ? "Done today" : "Queued"
      };
    });

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
            {!isReady ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                Loading habits...
              </div>
            ) : habits.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No active habits. Add one above to get started.
              </div>
            ) : (
              habits.map((habit) => (
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
                    variant={habit.status === "Done today" ? "default" : "secondary"}
                    className="max-w-full shrink-0 truncate sm:max-w-[12rem]"
                  >
                    {habit.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

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
