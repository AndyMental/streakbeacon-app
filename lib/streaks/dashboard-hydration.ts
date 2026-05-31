import {
  calculateCurrentStreak,
  STREAK_DATA_VERSION,
  type IsoDate,
  type StreakData
} from "./model";

export interface TodayHabit {
  name: string;
  streak: string;
  status: "Done today" | "Queued";
}

export interface Signal {
  label: string;
  value: string;
}

/**
 * Format a Date to YYYY-MM-DD IsoDate.
 */
export function formatIsoDay(date: Date): IsoDate {
  return date.toISOString().slice(0, 10) as IsoDate;
}

/**
 * Derives the list of habits for the 'Today' card, including current streaks
 * and completion status relative to the provided 'now' timestamp.
 */
export function hydrateTodayHabits(data: StreakData, now: Date): TodayHabit[] {
  const isoToday = formatIsoDay(now);

  return data.items
    .filter((item) => !item.archivedAt)
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      const completions = data.completions[item.id] || {};
      const streak = calculateCurrentStreak(completions, isoToday);
      const isDoneToday = !!completions[isoToday];

      return {
        name: item.name,
        streak: `${streak} day${streak === 1 ? "" : "s"}`,
        status: isDoneToday ? "Done today" : "Queued"
      };
    });
}

/**
 * Derives high-level signals for the dashboard, such as schema version,
 * storage type, and configured grid window.
 */
export function hydrateSignals(data: StreakData): Signal[] {
  return [
    {
      label: "Export format",
      value: `v${data.schemaVersion || STREAK_DATA_VERSION}`
    },
    { label: "Storage", value: "Local" },
    {
      label: "Grid window",
      value: String(data.preferences.gridWindowDays)
    }
  ];
}
