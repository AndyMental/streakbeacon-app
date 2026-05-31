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

export type WeeklyOverview = {
  days: GridDay[];
  rangeLabel: string;
  completedCount: number;
  totalCount: number;
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
  weeklyOverview: WeeklyOverview;
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
    activeItems.find((item) => item.id === selectedItemId) ??
    activeItems[0] ??
    null;
  const days = buildGridDays(
    data,
    activeItem?.id ?? null,
    selectedDay ?? formatIsoDay(asOf),
    asOf
  );
  const completions = activeItem ? data.completions[activeItem.id] : {};
  const completedDays = completions ? Object.keys(completions).length : 0;
  const selected =
    days.find((day) => day.day === selectedDay) ??
    days.find((day) => day.day === formatIsoDay(asOf)) ??
    days[days.length - 1];

  const weeklyOverview = buildWeeklyOverview(
    data,
    activeItem?.id ?? null,
    asOf
  );

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
      ? calculateCurrentStreak(completions ?? {}, formatIsoDay(asOf))
      : 0,
    longestStreak: activeItem ? calculateLongestStreak(completions ?? {}) : 0,
    selectedDay: selected,
    totalDays: days.length,
    weeks: chunkWeeks(days),
    weeklyOverview
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

function buildWeeklyOverview(
  data: StreakData,
  itemId: string | null,
  asOf: Date
): WeeklyOverview {
  const weekStartsOn = data.preferences.weekStartsOn;
  const endOfToday = parseIsoDay(formatIsoDay(asOf));
  const startOfWeek = getStartOfWeek(endOfToday, weekStartsOn);
  const completions = itemId ? data.completions[itemId] ?? {} : {};
  const days: GridDay[] = [];

  for (let index = 0; index < WEEK_DAYS; index += 1) {
    const date = addDays(startOfWeek, index);
    const day = formatIsoDay(date);
    const completion = completions[day];

    days.push({
      day,
      label: date.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
        weekday: "short"
      }),
      isComplete: Boolean(completion),
      intensity: getIntensity(completion, index),
      isSelected: day === formatIsoDay(asOf)
    });
  }

  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  return {
    days,
    rangeLabel: `${firstDay.label} – ${lastDay.label}`,
    completedCount: days.filter((d) => d.isComplete).length,
    totalCount: WEEK_DAYS
  };
}

function getStartOfWeek(date: Date, weekStartsOn: 0 | 1): Date {
  const day = date.getUTCDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  return addDays(date, -diff);
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
  const completions = itemId ? data.completions[itemId] ?? {} : {};
  const days: GridDay[] = [];

  for (let index = 0; index < windowDays; index += 1) {
    const date = addDays(start, index);
    const day = formatIsoDay(date);
    const completion = completions[day];

    days.push({
      day,
      label: date.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
        weekday: "short"
      }),
      isComplete: Boolean(completion),
      intensity: getIntensity(completion, index),
      isSelected: day === selectedDay
    });
  }

  return days;
}

function getIntensity(
  completion: Completion | undefined,
  index: number
): 0 | 1 | 2 | 3 | 4 {
  if (!completion) {
    return 0;
  }

  return ((index % 4) + 1) as 1 | 2 | 3 | 4;
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
