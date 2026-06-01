import {
  calculateCurrentStreak,
  calculateLongestStreak,
  MAX_GRID_WINDOW_DAYS,
  MIN_GRID_WINDOW_DAYS,
  type Completion,
  type IsoDate,
  type StreakData,
  type StreakItem
} from "./model";

export type GridDay = {
  day: IsoDate;
  label: string;
  isComplete: boolean;
  intensity: 0 | 1 | 2 | 3 | 4;
  isSelected: boolean;
};

export type GridWeek = {
  key: string;
  days: GridDay[];
};

export type StreakGridModel = {
  activeItem: StreakItem | null;
  completedDays: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  selectedDay: GridDay;
  totalDays: number;
  weeks: GridWeek[];
};

const WEEK_DAYS = 7;

export function buildStreakGridModel(
  data: StreakData,
  selectedItemId: string | null,
  selectedDay: IsoDate | null,
  asOf = new Date()
): StreakGridModel {
  const activeItems = data.items
    .filter((item) => !item.archivedAt)
    .sort((a, b) => a.order - b.order);

  let activeItem: StreakItem | null = null;
  let completions: Record<IsoDate, Completion> = {};

  if (selectedItemId === "all" || selectedItemId === null) {
    activeItem = null;
    // Aggregate completions from all active items
    for (const item of activeItems) {
      const itemCompletions = data.completions[item.id] ?? {};
      for (const [day, completion] of Object.entries(itemCompletions)) {
        const isoDay = day as IsoDate;
        if (!completions[isoDay]) {
          completions[isoDay] = completion;
        }
      }
    }
  } else {
    activeItem =
      activeItems.find((item) => item.id === selectedItemId) ??
      activeItems[0] ??
      null;
    completions = activeItem ? data.completions[activeItem.id] ?? {} : {};
  }

  const days = buildGridDays(
    data,
    (selectedItemId === "all" || selectedItemId === null) ? null : activeItem?.id ?? null,
    selectedDay ?? formatIsoDay(asOf),
    asOf
  );
  const completedDays = Object.keys(completions).length;
  const selected =
    days.find((day) => day.day === selectedDay) ??
    days.find((day) => day.day === formatIsoDay(asOf)) ??
    days[days.length - 1];

  return {
    activeItem,
    completedDays,
    completionRate:
      days.length === 0
        ? 0
        : Math.round(
            (days.filter((day) => day.isComplete).length / days.length) * 100
          ),
    currentStreak: completions
      ? calculateCurrentStreak(completions, formatIsoDay(asOf))
      : 0,
    longestStreak: completions ? calculateLongestStreak(completions) : 0,
    selectedDay: selected,
    totalDays: days.length,
    weeks: chunkWeeks(days)
  };
}

export function getNextSelectedCompletion(
  model: StreakGridModel
): boolean | null {
  // Toggle is only available for single-habit view
  if (!model.activeItem) {
    return null;
  }

  return !model.selectedDay.isComplete;
}

function buildGridDays(
  data: StreakData,
  itemId: string | null,
  selectedDay: IsoDate,
  asOf: Date
): GridDay[] {
  const windowDays = Math.max(
    MIN_GRID_WINDOW_DAYS,
    Math.min(data.preferences.gridWindowDays, MAX_GRID_WINDOW_DAYS)
  );
  const end = parseIsoDay(formatIsoDay(asOf));
  const start = addDays(end, -(windowDays - 1));

  const activeItems = data.items.filter((item) => !item.archivedAt);
  const totalActiveItems = activeItems.length;

  const days: GridDay[] = [];

  for (let index = 0; index < windowDays; index += 1) {
    const date = addDays(start, index);
    const day = formatIsoDay(date);

    let completionsCount = 0;
    if (itemId) {
      if (data.completions[itemId]?.[day]) {
        completionsCount = 1;
      }
    } else {
      // Cumulative view
      for (const item of activeItems) {
        if (data.completions[item.id]?.[day]) {
          completionsCount += 1;
        }
      }
    }

    days.push({
      day,
      label: date.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
        weekday: "short"
      }),
      isComplete: completionsCount > 0,
      intensity: getIntensity(completionsCount, itemId ? 1 : totalActiveItems),
      isSelected: day === selectedDay
    });
  }

  return days;
}

function getIntensity(
  completionsCount: number,
  totalActiveItems: number
): 0 | 1 | 2 | 3 | 4 {
  if (completionsCount === 0) {
    return 0;
  }

  if (totalActiveItems <= 1) {
    return 1;
  }

  const ratio = completionsCount / totalActiveItems;

  if (ratio <= 0.25) {
    return 1;
  }

  if (ratio <= 0.5) {
    return 2;
  }

  if (ratio <= 0.75) {
    return 3;
  }

  return 4;
}

function chunkWeeks(days: GridDay[]): GridWeek[] {
  const weeks: GridWeek[] = [];

  for (let index = 0; index < days.length; index += WEEK_DAYS) {
    const weekDays = days.slice(index, index + WEEK_DAYS);
    weeks.push({
      key: weekDays[0]?.day ?? String(index),
      days: weekDays
    });
  }

  return weeks;
}

function parseIsoDay(day: IsoDate): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

function formatIsoDay(day: Date): IsoDate {
  return day.toISOString().slice(0, 10) as IsoDate;
}

function addDays(day: Date, amount: number): Date {
  const next = new Date(day);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}
