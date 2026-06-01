"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { IsoDate, StreakData } from "@/lib/streaks/model";

interface WeeklyOverviewProps {
  data: StreakData;
  asOf?: Date;
}

export function WeeklyOverview({
  data,
  asOf = new Date(),
}: WeeklyOverviewProps) {
  const activeItems = data.items.filter((item) => !item.archivedAt);

  // Calculate the last 7 days ending at asOf
  const days: { day: IsoDate; label: string; shortLabel: string }[] = [];

  // Ensure we use UTC for date calculations to match the rest of the app's IsoDate pattern
  const end = new Date(asOf.toISOString().slice(0, 10) + "T00:00:00.000Z");

  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10) as IsoDate;
    days.push({
      day: iso,
      label: d.toLocaleDateString("en", {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      shortLabel: d.toLocaleDateString("en", {
        weekday: "narrow",
        timeZone: "UTC",
      }),
    });
  }

  if (activeItems.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Weekly Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-[1fr_repeat(7,2.5rem)] gap-2 border-b pb-2 text-xs font-medium text-muted-foreground sm:grid-cols-[1fr_repeat(7,3rem)]">
            <div className="truncate">Habit</div>
            {days.map((d) => (
              <div key={d.day} className="text-center">
                {d.shortLabel}
              </div>
            ))}
          </div>
          <TooltipProvider>
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_repeat(7,2.5rem)] items-center gap-2 sm:grid-cols-[1fr_repeat(7,3rem)]"
              >
                <div className="truncate text-sm font-medium">{item.name}</div>
                {days.map((d) => {
                  const isComplete = !!data.completions[item.id]?.[d.day];
                  return (
                    <Tooltip key={d.day}>
                      <TooltipTrigger asChild>
                        <div className="flex justify-center">
                          <div
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                              isComplete
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-muted-foreground/30"
                            )}
                            aria-label={`${item.name} on ${d.label}: ${
                              isComplete ? "Completed" : "Open"
                            }`}
                          >
                            {isComplete ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.label} - {isComplete ? "Complete" : "Open"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
