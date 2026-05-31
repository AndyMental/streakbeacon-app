"use client";

import {
  CalendarDays,
  CheckCircle2,
  Flame,
  Info,
  Plus,
  Trash2,
  Trophy
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
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
  assertStorageWritable,
  LocalStreakStorageAdapter,
  STREAK_DATA_CHANGED_EVENT
} from "@/lib/streaks/storage";
import { StreakStore } from "@/lib/streaks/store";

const DEMO_AS_OF = new Date("2026-05-27T12:00:00.000Z");
const STORAGE_ERROR_MESSAGE =
  "Local streak data is unavailable in this browser. You can still review the page, but completion changes will not be saved.";

function createBrowserStore() {
  assertStorageWritable(window.localStorage);
  return new StreakStore(new LocalStreakStorageAdapter(window.localStorage));
}

export function StreakDashboard() {
  const [data, setData] = useState<StreakData>(() =>
    createEmptyStreakData(DEMO_AS_OF)
  );
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<IsoDate | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const model = useMemo(
    () => buildStreakGridModel(data, selectedItemId, selectedDay, DEMO_AS_OF),
    [data, selectedDay, selectedItemId]
  );
  const selectedCompletion = getNextSelectedCompletion(model);
  const hasItems = data.items.length > 0;

  useEffect(() => {
    let cancelled = false;

    const loadSnapshot = () => {
      if (cancelled) {
        return;
      }

      try {
        const stored = createBrowserStore().getSnapshot();
        setData(stored);
        setSelectedItemId((current) =>
          current && stored.items.some((item) => item.id === current)
            ? current
            : stored.items[0]?.id ?? null
        );
        setStorageError(null);
      } catch {
        setStorageError(STORAGE_ERROR_MESSAGE);
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

    try {
      createBrowserStore().replaceData(next, now);
      setStorageError(null);
    } catch {
      setStorageError(STORAGE_ERROR_MESSAGE);
      return;
    }

    setData(next);
    window.dispatchEvent(new Event(STREAK_DATA_CHANGED_EVENT));
    toast.success(
      selectedCompletion ? "Marked complete" : "Completion cleared",
      {
        description: `${model.activeItem.name} - ${model.selectedDay.label}`
      }
    );
  }

  function deleteSelectedItem() {
    if (!model.activeItem) {
      return;
    }

    const removedId = model.activeItem.id;
    const removedName = model.activeItem.name;
    const now = new Date();

    let next: StreakData;
    try {
      next = createBrowserStore().deleteItem(removedId, now);
      setStorageError(null);
    } catch {
      setStorageError(STORAGE_ERROR_MESSAGE);
      return;
    }

    const remaining = next.items.filter((item) => !item.archivedAt);
    const fallbackId = remaining[0]?.id ?? null;

    setData(next);
    setSelectedItemId(fallbackId);
    setSelectedDay(null);
    window.dispatchEvent(new Event(STREAK_DATA_CHANGED_EVENT));
    toast.success("Habit deleted", {
      description: `${removedName} was removed from local storage.`
    });
  }

  function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newItemName.trim();

    if (!name) {
      setCreateError("Habit name is required.");
      return;
    }

    const now = new Date();
    const id = createItemId(name);

    try {
      const next = createBrowserStore().createItem({
        id,
        name,
        now
      });

      setData(next);
      setSelectedItemId(id);
      setNewItemName("");
      setCreateError(null);
      setStorageError(null);
      window.dispatchEvent(new Event(STREAK_DATA_CHANGED_EVENT));
      toast.success("Habit added", {
        description: `${name} is ready to track.`
      });
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Unable to add this habit."
      );

      if (isStorageError(error)) {
        setStorageError(STORAGE_ERROR_MESSAGE);
      }
    }
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
            <div className="flex flex-wrap items-center gap-2" aria-label="Streak selector">
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
              {model.activeItem ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`Delete ${model.activeItem.name}`}
                      disabled={!isReady || Boolean(storageError)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete {model.activeItem.name}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the habit and all of its completion
                        history from this browser. Other habits stay intact.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:opacity-90"
                        onClick={deleteSelectedItem}
                      >
                        Confirm delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form
            className="mb-4 grid gap-3 rounded-md border bg-muted/30 p-3 sm:grid-cols-[1fr_auto] sm:items-end"
            onSubmit={createItem}
          >
            <div className="grid gap-2">
              <Label htmlFor="new-streak-name">Add habit</Label>
              <Input
                id="new-streak-name"
                name="name"
                type="text"
                value={newItemName}
                maxLength={80}
                placeholder="Read for 20 minutes"
                aria-describedby={
                  createError ? "new-streak-error" : "new-streak-help"
                }
                disabled={!isReady}
                onChange={(event) => {
                  setNewItemName(event.target.value);
                  setCreateError(null);
                }}
              />
              <p id="new-streak-help" className="text-sm text-muted-foreground">
                Create the first streak in local storage.
              </p>
              {createError ? (
                <p id="new-streak-error" className="text-sm text-destructive">
                  {createError}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={!isReady || !newItemName.trim()}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add habit
            </Button>
          </form>

          {storageError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Storage unavailable</AlertTitle>
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
            <TooltipProvider>
              <div className="grid w-max min-w-full grid-flow-col auto-cols-[1.35rem] gap-1">
                {model.weeks.map((week) => (
                  <div key={week.key} className="grid grid-rows-7 gap-1">
                    {week.days.map((day) => (
                      <Tooltip key={day.day}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={`${day.label}: ${
                              day.isComplete ? "completed" : "not completed"
                            }`}
                            aria-pressed={day.isComplete}
                            onClick={() => selectDay(day)}
                            className={cn(
                              "h-5 w-5 rounded-sm border outline-none transition-transform motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              day.isSelected &&
                                "scale-110 border-foreground motion-reduce:scale-100",
                              getDayClassName(day.intensity)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {day.label} -{" "}
                          {day.isComplete ? "Complete" : "Open"}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </TooltipProvider>
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

function createItemId(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${slug || "streak"}-${suffix}`;
}

function isStorageError(error: unknown) {
  return error instanceof DOMException;
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
