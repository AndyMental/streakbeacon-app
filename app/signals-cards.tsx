"use client";

import { Flame, ShieldCheck, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  STREAK_DATA_CHANGED_EVENT,
  LocalStreakStorageAdapter
} from "@/lib/streaks/storage";
import { StreakStore } from "@/lib/streaks/store";
import { STREAK_DATA_VERSION, createEmptyStreakData } from "@/lib/streaks/model";

export function SignalsCards() {
  const [data, setData] = useState(() => createEmptyStreakData());

  useEffect(() => {
    const loadData = () => {
      try {
        const store = new StreakStore(
          new LocalStreakStorageAdapter(window.localStorage)
        );
        setData(store.getSnapshot());
      } catch {
        // Fallback to empty if storage unavailable
      }
    };

    loadData();
    window.addEventListener(STREAK_DATA_CHANGED_EVENT, loadData);
    return () => window.removeEventListener(STREAK_DATA_CHANGED_EVENT, loadData);
  }, []);

  const signals = [
    {
      label: "Export format",
      value: `v${data.schemaVersion ?? STREAK_DATA_VERSION}`,
      icon: ShieldCheck
    },
    { label: "Storage", value: "Local", icon: Flame },
    {
      label: "Grid window",
      value: data.preferences?.gridWindowDays?.toString() ?? "365",
      icon: Target
    }
  ];

  return (
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
  );
}
