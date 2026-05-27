import {
  createEmptyStreakData,
  STREAK_DATA_VERSION,
  type IsoDate,
  type StreakData,
  type StreakExportEnvelope,
  type StreakItem,
  type StreakPreferences
} from "./model";

export const STREAK_STORAGE_KEY = "streakbeacon:data";

export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

type StoredEnvelope = {
  app: "streakbeacon";
  dataVersion: number;
  savedAt: string;
  data: StreakData;
};

export class LocalStreakStorageAdapter {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly key = STREAK_STORAGE_KEY
  ) {}

  load(): StreakData {
    const raw = this.storage.getItem(this.key);

    if (!raw) {
      return createEmptyStreakData();
    }

    try {
      return parseStoredEnvelope(JSON.parse(raw)).data;
    } catch {
      return createEmptyStreakData();
    }
  }

  save(data: StreakData, savedAt = new Date()): void {
    const envelope: StoredEnvelope = {
      app: "streakbeacon",
      dataVersion: STREAK_DATA_VERSION,
      savedAt: savedAt.toISOString(),
      data: normalizeStreakData(data)
    };

    this.storage.setItem(this.key, JSON.stringify(envelope));
  }

  reset(): void {
    this.storage.removeItem(this.key);
  }

  export(data: StreakData, exportedAt = new Date()): StreakExportEnvelope {
    return {
      app: "streakbeacon",
      dataVersion: STREAK_DATA_VERSION,
      exportedAt: exportedAt.toISOString(),
      data: normalizeStreakData(data)
    };
  }
}

function parseStoredEnvelope(value: unknown): StoredEnvelope {
  if (!isRecord(value)) {
    throw new Error("Stored streak data must be an object");
  }

  if (value.app !== "streakbeacon") {
    throw new Error("Stored streak data belongs to a different app");
  }

  if (value.dataVersion !== STREAK_DATA_VERSION) {
    throw new Error("Stored streak data version is not supported");
  }

  return {
    app: "streakbeacon",
    dataVersion: STREAK_DATA_VERSION,
    savedAt: requireString(value.savedAt),
    data: normalizeStreakData(value.data)
  };
}

export function normalizeStreakData(value: unknown): StreakData {
  if (!isRecord(value)) {
    throw new Error("Streak data must be an object");
  }

  const preferences = normalizePreferences(value.preferences);
  const items = requireArray(value.items).map(normalizeItem);

  return { items, preferences };
}

function normalizeItem(value: unknown): StreakItem {
  if (!isRecord(value)) {
    throw new Error("Streak item must be an object");
  }

  return {
    id: requireString(value.id),
    name: requireString(value.name),
    createdAt: requireString(value.createdAt),
    updatedAt: requireString(value.updatedAt),
    completedDays: [
      ...new Set(requireArray(value.completedDays).map(requireIsoDate))
    ].sort()
  };
}

function normalizePreferences(value: unknown): StreakPreferences {
  if (!isRecord(value)) {
    return createEmptyStreakData().preferences;
  }

  return {
    weekStartsOn: normalizeWeekStartsOn(value.weekStartsOn),
    timezone:
      typeof value.timezone === "string" && value.timezone.trim()
        ? value.timezone
        : createEmptyStreakData().preferences.timezone
  };
}

function normalizeWeekStartsOn(value: unknown): StreakPreferences["weekStartsOn"] {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 6
  ) {
    return value as StreakPreferences["weekStartsOn"];
  }

  return createEmptyStreakData().preferences.weekStartsOn;
}

function requireString(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Expected string value");
  }

  return value;
}

function requireArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected array value");
  }

  return value;
}

function requireIsoDate(value: unknown): IsoDate {
  const day = requireString(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error(`Expected YYYY-MM-DD day, received: ${day}`);
  }

  return day as IsoDate;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
