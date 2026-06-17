"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { IsoDate, StreakData } from "@/lib/streaks/model";
import { cn } from "@/lib/utils";

interface WeeklyOverviewProps {
  data: StreakData;
  asOf: Date;
  className?: string;
}

type OverviewDay = {
  day: IsoDate;
  label: string;
  shortLabel: string;
};

function buildOverviewDays(asOf: Date): OverviewDay[] {
  const end = new Date(`${asOf.toISOString().slice(0, 10)}T00:00:00.000Z`);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - (6 - index));

    return {
      day: date.toISOString().slice(0, 10) as IsoDate,
      label: date.toLocaleDateString("en", {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      shortLabel: date.toLocaleDateString("en", {
        weekday: "narrow",
        timeZone: "UTC",
      }),
    };
  });
}

export function WeeklyOverview({ data, asOf, className }: WeeklyOverviewProps) {
  const activeItems = useMemo(
    () => data.items.filter((item) => !item.archivedAt),
    [data.items]
  );
  const days = useMemo(() => buildOverviewDays(asOf), [asOf]);

  if (activeItems.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <CardTitle>Weekly overview</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div
          className="overflow-x-auto pb-1"
          role="group"
          aria-label="Weekly completion overview"
        >
          <div className="grid min-w-[34rem] gap-3">
            <div className="grid grid-cols-[minmax(8rem,1fr)_repeat(7,2.5rem)] gap-2 text-xs font-medium text-muted-foreground sm:grid-cols-[minmax(10rem,1fr)_repeat(7,3rem)]">
              <div className="truncate">Habit</div>
              {days.map((day) => (
                <div key={day.day} className="text-center">
                  {day.shortLabel}
                </div>
              ))}
            </div>
            <TooltipProvider>
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(8rem,1fr)_repeat(7,2.5rem)] items-center gap-2 sm:grid-cols-[minmax(10rem,1fr)_repeat(7,3rem)]"
                >
                  <div className="truncate text-sm font-medium">
                    {item.name}
                  </div>
                  {days.map((day) => {
                    const isComplete = Boolean(
                      data.completions[item.id]?.[day.day]
                    );

                    return (
                      <Tooltip key={day.day}>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center">
                            <div
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                                isComplete
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted/50 text-muted-foreground/40"
                              )}
                              aria-label={`${item.name} on ${day.label}: ${
                                isComplete ? "Completed" : "Open"
                              }`}
                            >
                              {isComplete ? (
                                <CheckCircle2
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Circle
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {day.label} - {isComplete ? "Complete" : "Open"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
