"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  STREAK_DATA_CHANGED_EVENT,
  LocalStreakStorageAdapter
} from "@/lib/streaks/storage";
import { StreakStore } from "@/lib/streaks/store";
import {
  calculateCurrentStreak,
  createEmptyStreakData,
  type IsoDate
} from "@/lib/streaks/model";

export function TodayCards() {
  const [data, setData] = useState(() => createEmptyStreakData());
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const loadData = () => {
      try {
        const store = new StreakStore(
          new LocalStreakStorageAdapter(window.localStorage)
        );
        setData(store.getSnapshot());
      } catch {
        // Fallback
      }
      setNow(new Date());
    };

    loadData();
    window.addEventListener(STREAK_DATA_CHANGED_EVENT, loadData);
    return () => window.removeEventListener(STREAK_DATA_CHANGED_EVENT, loadData);
  }, []);

  const today = now.toISOString().slice(0, 10) as IsoDate;
  const activeItems = data.items.filter((item) => !item.archivedAt);

  return (
    <Card>
      <CardHeader className="border-b py-3">
        <CardTitle>Today</CardTitle>
      </CardHeader>
      <div className="divide-y">
        {activeItems.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No habits added yet.
          </div>
        ) : (
          activeItems.map((item) => {
            const completions = data.completions[item.id] ?? {};
            const streak = calculateCurrentStreak(completions, today);
            const isDone = Boolean(completions[today]);

            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {streak} {streak === 1 ? "day" : "days"}
                  </p>
                </div>
                <Badge
                  variant={isDone ? "secondary" : "outline"}
                  className="max-w-full shrink-0 truncate sm:max-w-[12rem]"
                >
                  {isDone ? "Done today" : "Pending"}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
