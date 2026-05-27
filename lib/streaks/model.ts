export const STREAK_DATA_VERSION = 1;

export type IsoDate = `${number}-${number}-${number}`;

export type StreakItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  completedDays: IsoDate[];
};

export type StreakPreferences = {
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  timezone: string;
};

export type StreakData = {
  items: StreakItem[];
  preferences: StreakPreferences;
};

export type StreakExportEnvelope = {
  app: "streakbeacon";
  dataVersion: typeof STREAK_DATA_VERSION;
  exportedAt: string;
  data: StreakData;
};

export type CreateStreakInput = {
  id: string;
  name: string;
  now: Date;
};

export type RenameStreakInput = {
  id: string;
  name: string;
  now: Date;
};

export const defaultPreferences: StreakPreferences = {
  weekStartsOn: 1,
  timezone: "UTC"
};

export function createEmptyStreakData(): StreakData {
  return {
    items: [],
    preferences: { ...defaultPreferences }
  };
}

export function createStreakItem(input: CreateStreakInput): StreakItem {
  const name = normalizeName(input.name);
  const timestamp = input.now.toISOString();

  return {
    id: input.id,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedDays: []
  };
}

export function addStreakItem(
  data: StreakData,
  input: CreateStreakInput
): StreakData {
  if (data.items.some((item) => item.id === input.id)) {
    throw new Error(`Streak item already exists: ${input.id}`);
  }

  return {
    ...data,
    items: [...data.items, createStreakItem(input)]
  };
}

export function renameStreakItem(
  data: StreakData,
  input: RenameStreakInput
): StreakData {
  const name = normalizeName(input.name);

  return updateItem(data, input.id, (item) => ({
    ...item,
    name,
    updatedAt: input.now.toISOString()
  }));
}

export function deleteStreakItem(data: StreakData, id: string): StreakData {
  return {
    ...data,
    items: data.items.filter((item) => item.id !== id)
  };
}

export function setDayCompletion(
  data: StreakData,
  id: string,
  day: IsoDate,
  isComplete: boolean,
  now: Date
): StreakData {
  assertIsoDate(day);

  return updateItem(data, id, (item) => {
    const completedDays = new Set(item.completedDays);

    if (isComplete) {
      completedDays.add(day);
    } else {
      completedDays.delete(day);
    }

    return {
      ...item,
      completedDays: [...completedDays].sort(),
      updatedAt: now.toISOString()
    };
  });
}

export function updatePreferences(
  data: StreakData,
  preferences: Partial<StreakPreferences>
): StreakData {
  return {
    ...data,
    preferences: {
      ...data.preferences,
      ...preferences
    }
  };
}

export function calculateCurrentStreak(
  item: Pick<StreakItem, "completedDays">,
  asOfDay: IsoDate
): number {
  assertIsoDate(asOfDay);

  const completedDays = new Set(item.completedDays);
  let cursor = completedDays.has(asOfDay)
    ? parseIsoDay(asOfDay)
    : addDays(parseIsoDay(asOfDay), -1);
  let streak = 0;

  while (completedDays.has(formatIsoDay(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function calculateLongestStreak(
  item: Pick<StreakItem, "completedDays">
): number {
  const sortedDays = [...new Set(item.completedDays)].sort();
  let longest = 0;
  let current = 0;
  let previous: Date | null = null;

  for (const day of sortedDays) {
    assertIsoDate(day);
    const parsed = parseIsoDay(day);

    current =
      previous && formatIsoDay(addDays(previous, 1)) === day ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = parsed;
  }

  return longest;
}

export function createExportEnvelope(
  data: StreakData,
  exportedAt: Date
): StreakExportEnvelope {
  return {
    app: "streakbeacon",
    dataVersion: STREAK_DATA_VERSION,
    exportedAt: exportedAt.toISOString(),
    data
  };
}

function updateItem(
  data: StreakData,
  id: string,
  updater: (item: StreakItem) => StreakItem
): StreakData {
  let found = false;
  const items = data.items.map((item) => {
    if (item.id !== id) {
      return item;
    }

    found = true;
    return updater(item);
  });

  if (!found) {
    throw new Error(`Streak item not found: ${id}`);
  }

  return { ...data, items };
}

function normalizeName(name: string): string {
  const normalized = name.trim();

  if (!normalized) {
    throw new Error("Streak item name is required");
  }

  return normalized;
}

function assertIsoDate(day: string): asserts day is IsoDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error(`Expected YYYY-MM-DD day, received: ${day}`);
  }
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
