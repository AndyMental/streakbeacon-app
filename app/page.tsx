import { Activity, CalendarCheck, Flame, Target } from "lucide-react";

const habits = [
  { name: "Morning walk", streak: "12 days", status: "Done today" },
  { name: "Ship one useful change", streak: "5 days", status: "Queued" },
  { name: "Evening shutdown", streak: "8 days", status: "Due tonight" }
];

const signals = [
  { label: "Active streaks", value: "3", icon: Flame },
  { label: "Weekly check-ins", value: "18", icon: CalendarCheck },
  { label: "Focus score", value: "86%", icon: Target }
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase text-muted-foreground">
            StreakBeacon
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            Local-first streak visibility
          </h1>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
          Baseline app scaffold
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {signals.map((signal) => {
          const Icon = signal.icon;

          return (
            <article
              key={signal.label}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{signal.label}</p>
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-semibold">{signal.value}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Today</h2>
          </div>
          <div className="divide-y">
            {habits.map((habit) => (
              <div
                key={habit.name}
                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{habit.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {habit.streak}
                  </p>
                </div>
                <span className="w-fit rounded-md bg-secondary px-2.5 py-1 text-sm font-medium text-secondary-foreground">
                  {habit.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border bg-card p-4">
          <h2 className="text-base font-semibold">App baseline</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This first screen keeps the product local-first and leaves room for
            future App Router route handlers without adding persistence or
            separate infrastructure.
          </p>
        </aside>
      </section>
    </main>
  );
}
