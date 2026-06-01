"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateCurrentStreak,
  createEmptyStreakData,
  type StreakData
} from "@/lib/streaks/model";
import {
  assertStorageWritable,
  LocalStreakStorageAdapter,
  STREAK_DATA_CHANGED_EVENT
} from "@/lib/streaks/storage";
import { StreakStore } from "@/lib/streaks/store";

function createBrowserStore() {
  assertStorageWritable(window.localStorage);
  return new StreakStore(new LocalStreakStorageAdapter(window.localStorage));
}

export function TodayCard() {
  const [data, setData] = useState<StreakData>(() => createEmptyStreakData());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSnapshot = () => {
      if (cancelled) {
        return;
      }

      try {
        setData(createBrowserStore().getSnapshot());
      } catch {
        // Fallback to empty state on storage error
      }

      setIsReady(true);
    };

    queueMicrotask(loadSnapshot);
    window.addEventListener(STREAK_DATA_CHANGED_EVENT, loadSnapshot);

    return () => {
      cancelled = true;
      window.removeEventListener(STREAK_DATA_CHANGED_EVENT, loadSnapshot);
    };
  }, []);

  const activeItems = data.items.filter((item) => !item.archivedAt);
  const today = new Date().toISOString().slice(0, 10) as `${number}-${number}-${number}`;

  if (!isReady) {
    return (
      <Card>
        <CardHeader className="border-b py-3">
          <CardTitle>Today</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-8 text-center text-sm text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (activeItems.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b py-3">
          <CardTitle>Today</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-8 text-center text-sm text-muted-foreground">
          No habits tracked yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b py-3">
        <CardTitle>Today</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {activeItems.map((item) => {
            const completions = data.completions[item.id] ?? {};
            const isDoneToday = Boolean(completions[today]);
            const streak = calculateCurrentStreak(completions, today);

            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {streak} day{streak === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge
                  variant={isDoneToday ? "default" : "secondary"}
                  className="max-w-full shrink-0 truncate sm:max-w-[12rem]"
                >
                  {isDoneToday ? "Done today" : "Due tonight"}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
