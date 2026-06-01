import {
  calculateCurrentStreak,
  calculateLongestStreak,
  MAX_GRID_WINDOW_DAYS,
  MIN_GRID_WINDOW_DAYS,
  type IsoDate,
  type StreakData,
  type StreakItem,
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
  const activeItem =
    selectedItemId === null
      ? null
      : (activeItems.find((item) => item.id === selectedItemId) ??
        activeItems[0] ??
        null);
  const days = buildGridDays(
    data,
    activeItem?.id ?? null,
    selectedDay ?? formatIsoDay(asOf),
    asOf
  );
  const completions = activeItem ? (data.completions[activeItem.id] ?? {}) : {};
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
    currentStreak: activeItem
      ? calculateCurrentStreak(completions, formatIsoDay(asOf))
      : 0,
    longestStreak: activeItem ? calculateLongestStreak(completions) : 0,
    selectedDay: selected,
    totalDays: days.length,
    weeks: chunkWeeks(days),
  };
}

export function getNextSelectedCompletion(
  model: StreakGridModel
): boolean | null {
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
  const activeItemIds = data.items
    .filter((i) => !i.archivedAt)
    .map((i) => i.id);
  const days: GridDay[] = [];

  for (let index = 0; index < windowDays; index += 1) {
    const date = addDays(start, index);
    const day = formatIsoDay(date);
    let isComplete = false;
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;

    if (itemId) {
      const completion = data.completions[itemId]?.[day];
      isComplete = Boolean(completion);
      intensity = isComplete ? 1 : 0;
    } else {
      let completedCount = 0;
      for (const id of activeItemIds) {
        if (data.completions[id]?.[day]) {
          completedCount++;
        }
      }
      isComplete = completedCount > 0;
      intensity = Math.min(completedCount, 4) as 0 | 1 | 2 | 3 | 4;
    }

    days.push({
      day,
      label: date.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
        weekday: "short",
      }),
      isComplete,
      intensity,
      isSelected: day === selectedDay,
    });
  }

  return days;
}

function chunkWeeks(days: GridDay[]): GridWeek[] {
  const weeks: GridWeek[] = [];

  for (let index = 0; index < days.length; index += WEEK_DAYS) {
    const weekDays = days.slice(index, index + WEEK_DAYS);
    weeks.push({
      key: weekDays[0]?.day ?? String(index),
      days: weekDays,
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
