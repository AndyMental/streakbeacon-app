"use client";

import { CalendarDays, CheckCircle2, Flame, Info, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  createEmptyStreakData,
  setDayCompletion,
  type IsoDate,
  type StreakData
} from "@/lib/streaks/model";
import {
  buildStreakGridModel,
  getNextSelectedCompletion,
  type GridDay
} from "@/lib/streaks/grid";
import {
  DASHBOARD_STORAGE_UNAVAILABLE_MESSAGE,
  resolveBrowserStreakStore,
  STORAGE_UNAVAILABLE_TITLE
} from "@/lib/streaks/browser-store";

const DEMO_AS_OF = new Date("2026-05-27T12:00:00.000Z");

export function StreakDashboard() {
  const [data, setData] = useState<StreakData>(() =>
    createEmptyStreakData(DEMO_AS_OF)
  );
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<IsoDate | null>(null);
  const model = useMemo(
    () => buildStreakGridModel(data, selectedItemId, selectedDay, DEMO_AS_OF),
    [data, selectedDay, selectedItemId]
  );
  const selectedCompletion = getNextSelectedCompletion(model);
  const hasItems = data.items.length > 0;

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      const storeResult = resolveBrowserStreakStore(
        () => window.localStorage,
        DASHBOARD_STORAGE_UNAVAILABLE_MESSAGE
      );

      if (!storeResult.ok) {
        setStorageError(storeResult.alert.description);
        setIsReady(true);
        return;
      }

      try {
        const stored = storeResult.store.getSnapshot();
        setData(stored);
        setSelectedItemId(stored.items[0]?.id ?? null);
        setStorageError(null);
      } catch {
        setStorageError(DASHBOARD_STORAGE_UNAVAILABLE_MESSAGE);
      }

      setIsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function selectDay(day: GridDay) {
    setSelectedDay(day.day);
  }

  function toggleSelectedDay() {
    if (!model.activeItem || selectedCompletion === null) {
      return;
    }

    const now = new Date();
    const next = setDayCompletion(
      data,
      model.activeItem.id,
      model.selectedDay.day,
      selectedCompletion,
      now
    );

    const storeResult = resolveBrowserStreakStore(
      () => window.localStorage,
      DASHBOARD_STORAGE_UNAVAILABLE_MESSAGE
    );

    if (!storeResult.ok) {
      setStorageError(storeResult.alert.description);
      return;
    }

    try {
      storeResult.store.replaceData(next, now);
      setStorageError(null);
    } catch {
      setStorageError(DASHBOARD_STORAGE_UNAVAILABLE_MESSAGE);
      return;
    }

    setData(next);
    toast.success(
      selectedCompletion ? "Marked complete" : "Completion cleared",
      {
        description: `${model.activeItem.name} - ${model.selectedDay.label}`
      }
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Streak grid</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {!isReady
                  ? "Loading local streak data"
                  : model.activeItem?.name ?? "No active streak"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.items.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={item.id === model.activeItem?.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedItemId(item.id)}
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {storageError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>{STORAGE_UNAVAILABLE_TITLE}</AlertTitle>
              <AlertDescription>{storageError}</AlertDescription>
            </Alert>
          ) : null}

          {isReady && !hasItems ? (
            <Alert variant="muted" className="mb-4">
              <Info className="absolute right-3 top-3 h-4 w-4 text-primary" />
              <AlertTitle>No streaks yet</AlertTitle>
              <AlertDescription>
                Add a habit to start filling the local completion grid. Until
                then, the calendar stays empty and summary metrics remain at
                zero.
              </AlertDescription>
            </Alert>
          ) : null}

          <div
            className="overflow-x-auto pb-2"
            role="group"
            aria-label="Recent completion history"
          >
            <div className="grid w-max min-w-full grid-flow-col auto-cols-[1.35rem] gap-1">
              {model.weeks.map((week) => (
                <div key={week.key} className="grid grid-rows-7 gap-1">
                  {week.days.map((day) => (
                    <button
                      key={day.day}
                      type="button"
                      aria-label={`${day.label}: ${
                        day.isComplete ? "completed" : "not completed"
                      }`}
                      aria-pressed={day.isComplete}
                      onClick={() => selectDay(day)}
                      className={cn(
                        "h-5 w-5 rounded-sm border outline-none transition-transform motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        day.isSelected && "scale-110 motion-reduce:scale-100 border-foreground",
                        getDayClassName(day.intensity)
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((intensity) => (
                <span
                  key={intensity}
                  className={cn(
                    "h-3.5 w-3.5 rounded-sm border",
                    getDayClassName(intensity)
                  )}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <SummaryCard
          label="Current"
          value={model.currentStreak}
          suffix="days"
          icon={Flame}
        />
        <SummaryCard
          label="Longest"
          value={model.longestStreak}
          suffix="days"
          icon={Trophy}
        />
        <SummaryCard
          label="Completed"
          value={model.completedDays}
          suffix="total"
          icon={CheckCircle2}
        />
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Selected day</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={model.selectedDay.isComplete ? "default" : "outline"}>
              {model.selectedDay.isComplete ? "Complete" : "Open"}
            </Badge>
            <p className="mt-3 text-sm text-muted-foreground">
              {model.selectedDay.label}
            </p>
            <Button
              type="button"
              className="mt-4 w-full"
              variant={model.selectedDay.isComplete ? "outline" : "default"}
              onClick={toggleSelectedDay}
              disabled={!model.activeItem || !isReady || Boolean(storageError)}
            >
              {!isReady
                ? "Loading"
                : model.selectedDay.isComplete
                  ? "Mark Open"
                  : "Mark Complete"}
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              {model.completionRate}% of visible days complete.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  suffix,
  icon: Icon
}: {
  label: string;
  value: number;
  suffix: string;
  icon: typeof Flame;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <p className="mt-3 text-2xl font-semibold">
          {value}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {suffix}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

function getDayClassName(intensity: number) {
  switch (intensity) {
    case 1:
      return "border-streak-1-border bg-streak-1";
    case 2:
      return "border-streak-2-border bg-streak-2";
    case 3:
      return "border-streak-3-border bg-streak-3";
    case 4:
      return "border-streak-4-border bg-streak-4";
    default:
      return "border-streak-empty-border bg-streak-empty";
  }
}
