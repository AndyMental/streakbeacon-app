export const STREAK_DATA_VERSION = 1;
export const STREAK_EXPORT_FORMAT = "streakbeacon.export";
export const DEFAULT_ACCENT_COLOR = "#27AE60";
export const MIN_GRID_WINDOW_DAYS = 7;
export const MAX_GRID_WINDOW_DAYS = 365;
export const DEFAULT_GRID_WINDOW_DAYS = 365;

export type IsoDate = `${number}-${number}-${number}`;
export type ThemePreference = "system" | "light" | "dark";
export type CompletionSource = "manual" | "import";

export type Completion = {
  completedAt: string;
  source?: CompletionSource;
};

export type StreakItem = {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  order: number;
  archivedAt: string | null;
};

export type StreakPreferences = {
  theme: ThemePreference;
  weekStartsOn: 0 | 1;
  gridWindowDays: number;
  showArchived: boolean;
  accentColor: string;
};

export type StreakData = {
  schemaVersion: typeof STREAK_DATA_VERSION;
  createdAt: string;
  updatedAt: string;
  items: StreakItem[];
  completions: Record<string, Record<IsoDate, Completion>>;
  preferences: StreakPreferences;
};

export type StreakExportEnvelope = {
  format: typeof STREAK_EXPORT_FORMAT;
  formatVersion: typeof STREAK_DATA_VERSION;
  exportedAt: string;
  app: {
    name: "StreakBeacon";
  };
  data: StreakData;
};

export type CreateStreakInput = {
  id: string;
  name: string;
  now: Date;
  description?: string;
  color?: string;
};

export type RenameStreakInput = {
  id: string;
  name: string;
  now: Date;
  description?: string;
  color?: string;
};

export const defaultPreferences: StreakPreferences = {
  theme: "system",
  weekStartsOn: 0,
  gridWindowDays: DEFAULT_GRID_WINDOW_DAYS,
  showArchived: false,
  accentColor: DEFAULT_ACCENT_COLOR
};

export function createEmptyStreakData(now = new Date()): StreakData {
  const timestamp = now.toISOString();

  return {
    schemaVersion: STREAK_DATA_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
    items: [],
    completions: {},
    preferences: { ...defaultPreferences }
  };
}

export function createStreakItem(
  input: CreateStreakInput,
  order = 0
): StreakItem {
  const timestamp = input.now.toISOString();

  return {
    id: normalizeRequiredString(input.id, "Streak item id"),
    name: normalizeName(input.name),
    description: normalizeOptionalString(input.description, 240),
    color: normalizeColor(input.color),
    createdAt: timestamp,
    updatedAt: timestamp,
    order,
    archivedAt: null
  };
}

export function addStreakItem(
  data: StreakData,
  input: CreateStreakInput
): StreakData {
  if (data.items.some((item) => item.id === input.id)) {
    throw new Error(`Streak item already exists: ${input.id}`);
  }

  const item = createStreakItem(input, data.items.length);

  return touch(
    {
      ...data,
      items: [...data.items, item],
      completions: {
        ...data.completions,
        [item.id]: {}
      }
    },
    input.now
  );
}

export function renameStreakItem(
  data: StreakData,
  input: RenameStreakInput
): StreakData {
  const name = normalizeName(input.name);

  return updateItem(
    data,
    input.id,
    (item) => ({
      ...item,
      name,
      description:
        input.description === undefined
          ? item.description
          : normalizeOptionalString(input.description, 240),
      color: input.color === undefined ? item.color : normalizeColor(input.color),
      updatedAt: input.now.toISOString()
    }),
    input.now
  );
}

export function deleteStreakItem(
  data: StreakData,
  id: string,
  now = new Date()
): StreakData {
  const completions = { ...data.completions };
  delete completions[id];

  return touch(
    {
      ...data,
      items: data.items.filter((item) => item.id !== id),
      completions
    },
    now
  );
}

export function setDayCompletion(
  data: StreakData,
  id: string,
  day: IsoDate,
  isComplete: boolean,
  now: Date
): StreakData {
  assertIsoDate(day);

  if (!data.items.some((item) => item.id === id)) {
    throw new Error(`Streak item not found: ${id}`);
  }

  const itemCompletions = { ...(data.completions[id] ?? {}) };

  if (isComplete) {
    itemCompletions[day] = {
      completedAt: now.toISOString(),
      source: "manual"
    };
  } else {
    delete itemCompletions[day];
  }

  return touch(
    {
      ...data,
      completions: {
        ...data.completions,
        [id]: itemCompletions
      }
    },
    now
  );
}

export function updatePreferences(
  data: StreakData,
  preferences: Partial<StreakPreferences>,
  now = new Date()
): StreakData {
  return touch(
    {
      ...data,
      preferences: normalizePreferences({
        ...data.preferences,
        ...preferences
      })
    },
    now
  );
}

export function calculateCurrentStreak(
  completions: Record<IsoDate, Completion>,
  asOfDay: IsoDate
): number {
  assertIsoDate(asOfDay);

  let cursor = completions[asOfDay]
    ? parseIsoDay(asOfDay)
    : addDays(parseIsoDay(asOfDay), -1);
  let streak = 0;

  while (completions[formatIsoDay(cursor)]) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function calculateLongestStreak(
  completions: Record<IsoDate, Completion>
): number {
  const sortedDays = Object.keys(completions).sort() as IsoDate[];
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
    format: STREAK_EXPORT_FORMAT,
    formatVersion: STREAK_DATA_VERSION,
    exportedAt: exportedAt.toISOString(),
    app: {
      name: "StreakBeacon"
    },
    data
  };
}

export function normalizePreferences(value: unknown): StreakPreferences {
  const record = isRecord(value) ? value : {};

  return {
    theme: normalizeTheme(record.theme),
    weekStartsOn: record.weekStartsOn === 1 ? 1 : 0,
    gridWindowDays: normalizeGridWindowDays(record.gridWindowDays),
    showArchived: record.showArchived === true,
    accentColor:
      typeof record.accentColor === "string" && record.accentColor.trim()
        ? record.accentColor.trim()
        : DEFAULT_ACCENT_COLOR
  };
}

export function assertIsoDate(day: string): asserts day is IsoDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error(`Expected YYYY-MM-DD day, received: ${day}`);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeStreaks(
  existing: StreakData,
  incoming: StreakData,
  now = new Date()
): StreakData {
  const mergedItems = [...existing.items];
  const itemIds = new Set(existing.items.map((i) => i.id));

  for (const item of incoming.items) {
    if (itemIds.has(item.id)) {
      const index = mergedItems.findIndex((i) => i.id === item.id);
      // Prefer the version with the most recent updatedAt
      if (
        new Date(item.updatedAt).getTime() >
        new Date(mergedItems[index].updatedAt).getTime()
      ) {
        mergedItems[index] = item;
      }
    } else {
      mergedItems.push(item);
      itemIds.add(item.id);
    }
  }

  const mergedCompletions: Record<string, Record<IsoDate, Completion>> = {};

  for (const itemId of itemIds) {
    const existingCompletions = existing.completions[itemId] || {};
    const incomingCompletions = incoming.completions[itemId] || {};

    mergedCompletions[itemId] = {
      ...existingCompletions,
      ...incomingCompletions
    };
  }

  return {
    ...existing,
    items: mergedItems,
    completions: mergedCompletions,
    updatedAt: now.toISOString()
  };
}

function updateItem(
  data: StreakData,
  id: string,
  updater: (item: StreakItem) => StreakItem,
  now: Date
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

  return touch({ ...data, items }, now);
}

function touch(data: StreakData, now: Date): StreakData {
  return {
    ...data,
    updatedAt: now.toISOString()
  };
}

function normalizeName(name: string): string {
  return normalizeRequiredString(name, "Streak item name", 80);
}

function normalizeRequiredString(
  value: string,
  label: string,
  maxLength?: number
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${label} is required`);
  }

  if (maxLength && normalized.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or less`);
  }

  return normalized;
}

function normalizeOptionalString(value: string | undefined, maxLength: number) {
  const normalized = value?.trim() ?? "";

  if (normalized.length > maxLength) {
    throw new Error(`Value must be ${maxLength} characters or less`);
  }

  return normalized;
}

function normalizeColor(value: string | undefined): string {
  const normalized = value?.trim();
  return normalized || DEFAULT_ACCENT_COLOR;
}

function normalizeTheme(value: unknown): ThemePreference {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

function normalizeGridWindowDays(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return DEFAULT_GRID_WINDOW_DAYS;
  }

  return Math.min(Math.max(value, MIN_GRID_WINDOW_DAYS), MAX_GRID_WINDOW_DAYS);
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
