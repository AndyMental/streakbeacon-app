import {
  createEmptyStreakData,
  createExportEnvelope,
  isRecord,
  normalizePreferences,
  STREAK_DATA_VERSION,
  STREAK_EXPORT_FORMAT,
  type Completion,
  type IsoDate,
  type StreakData,
  type StreakExportEnvelope,
  type StreakItem
} from "./model";

export const STREAK_STORAGE_KEY = "streakbeacon:data:v1";
export const STREAK_DATA_CHANGED_EVENT = "streakbeacon:data-changed";
const STREAK_STORAGE_PROBE_KEY = `${STREAK_STORAGE_KEY}:probe`;

export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type ImportPreview = {
  data: StreakData;
  itemCount: number;
  completionCount: number;
  preferenceCount: number;
  warnings: string[];
};

export type ImportValidationResult =
  | {
      ok: true;
      preview: ImportPreview;
    }
  | {
      ok: false;
      errors: string[];
    };

export function assertStorageWritable(
  storage: KeyValueStorage,
  probeKey = STREAK_STORAGE_PROBE_KEY
): void {
  const previous = storage.getItem(probeKey);

  storage.setItem(probeKey, "1");

  if (previous === null) {
    storage.removeItem(probeKey);
  } else {
    storage.setItem(probeKey, previous);
  }
}

export class LocalStreakStorageAdapter {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly key = STREAK_STORAGE_KEY
  ) {}

  load(): StreakData {
    let raw: string | null;

    try {
      raw = this.storage.getItem(this.key);
    } catch {
      return createEmptyStreakData();
    }

    if (!raw) {
      return createEmptyStreakData();
    }

    try {
      return parseStreakData(JSON.parse(raw));
    } catch {
      return createEmptyStreakData();
    }
  }

  save(data: StreakData, savedAt = new Date()): void {
    const normalized = {
      ...parseStreakData(data),
      updatedAt: savedAt.toISOString()
    };

    try {
      this.storage.setItem(this.key, JSON.stringify(normalized));
    } catch {
      // Keep app-layer state changes usable when browser persistence is denied.
    }
  }

  replace(data: StreakData, savedAt = new Date()): StreakData {
    const normalized = {
      ...parseStreakData(data),
      updatedAt: savedAt.toISOString()
    };

    try {
      this.storage.setItem(this.key, JSON.stringify(normalized));
    } catch {
      // Keep import/reset flows non-fatal when browser persistence is denied.
    }

    return normalized;
  }

  reset(): void {
    try {
      this.storage.removeItem(this.key);
    } catch {
      // Reset should remain non-fatal in browsers that block storage access.
    }
  }

  export(data: StreakData, exportedAt = new Date()): StreakExportEnvelope {
    return createExportEnvelope(parseStreakData(data), exportedAt);
  }
}

export function validateImportText(input: string): ImportValidationResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch {
    return {
      ok: false,
      errors: ["The selected file is not valid JSON."]
    };
  }

  try {
    const { envelope, warnings } = parseExportEnvelope(parsed);

    return {
      ok: true,
      preview: {
        data: envelope.data,
        itemCount: envelope.data.items.length,
        completionCount: countCompletions(envelope.data.completions),
        preferenceCount: Object.keys(envelope.data.preferences).length,
        warnings
      }
    };
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : "Import failed."]
    };
  }
}

export function parseExportEnvelope(value: unknown): {
  envelope: StreakExportEnvelope;
  warnings: string[];
} {
  if (!isRecord(value)) {
    throw new Error("Import file must contain a StreakBeacon export object.");
  }

  if (value.format !== STREAK_EXPORT_FORMAT) {
    throw new Error("Import file is not a StreakBeacon export.");
  }

  if (value.formatVersion !== STREAK_DATA_VERSION) {
    throw new Error("Import file version is not supported.");
  }

  if (!isRecord(value.app) || value.app.name !== "StreakBeacon") {
    throw new Error("Import file app metadata is invalid.");
  }

  const data = parseStreakData(value.data);
  const warnings = collectImportWarnings(data);

  return {
    envelope: {
      format: STREAK_EXPORT_FORMAT,
      formatVersion: STREAK_DATA_VERSION,
      exportedAt: requireIsoTimestamp(value.exportedAt, "exportedAt"),
      app: {
        name: "StreakBeacon"
      },
      data
    },
    warnings
  };
}

export function parseStreakData(value: unknown): StreakData {
  const raw = migrateData(value);

  if (raw.schemaVersion !== STREAK_DATA_VERSION) {
    throw new Error("Streak data schema version is not supported.");
  }

  const items = requireArray(raw.items, "items").map(normalizeItem);
  const itemIds = new Set<string>();

  for (const item of items) {
    if (itemIds.has(item.id)) {
      throw new Error(`Import contains a duplicate item id: ${item.id}.`);
    }

    itemIds.add(item.id);
  }

  return {
    schemaVersion: STREAK_DATA_VERSION,
    createdAt: requireIsoTimestamp(raw.createdAt, "createdAt"),
    updatedAt: requireIsoTimestamp(raw.updatedAt, "updatedAt"),
    items,
    completions: normalizeCompletions(raw.completions, itemIds),
    preferences: normalizePreferences(raw.preferences)
  };
}

function migrateData(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {
      schemaVersion: STREAK_DATA_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
      completions: {},
      preferences: {}
    };
  }

  let data = { ...value };

  // Phase 1: Ensure we have a valid starting version number
  if (typeof data.schemaVersion !== "number" || data.schemaVersion < 1) {
    data.schemaVersion = 1;
  }

  // Phase 2: Sequential migrations
  while (typeof data.schemaVersion === "number" && data.schemaVersion < STREAK_DATA_VERSION) {
    const currentVersion: number = data.schemaVersion;
    
    if (currentVersion === 1) {
      data = migrateV1ToV2(data);
    } else {
      // Avoid infinite loop if we hit an unknown version that is less than current
      break;
    }
  }

  // Phase 3: Final normalization of common fields to ensure parseStreakData doesn't throw
  // on missing top-level keys after migration.
  if (typeof data.createdAt !== "string") {
    data.createdAt = new Date().toISOString();
  }

  if (typeof data.updatedAt !== "string") {
    data.updatedAt = data.createdAt;
  }

  if (!Array.isArray(data.items)) {
    data.items = [];
  }

  if (!isRecord(data.completions)) {
    data.completions = {};
  }

  if (!isRecord(data.preferences)) {
    data.preferences = {};
  }

  return data;
}

function migrateV1ToV2(data: Record<string, unknown>): Record<string, unknown> {
  return {
    ...data,
    schemaVersion: 2
  };
}

function normalizeItem(value: unknown): StreakItem {
  if (!isRecord(value)) {
    throw new Error("Every item must be an object.");
  }

  return {
    id: requireString(value.id, "item.id", 128),
    name: requireString(value.name, "item.name", 80),
    description:
      typeof value.description === "string"
        ? requireOptionalString(value.description, "item.description", 240)
        : "",
    color:
      typeof value.color === "string" && value.color.trim()
        ? value.color.trim()
        : "#27AE60",
    createdAt: requireIsoTimestamp(value.createdAt, "item.createdAt"),
    updatedAt: requireIsoTimestamp(value.updatedAt, "item.updatedAt"),
    order: requireNonNegativeInteger(value.order, "item.order"),
    archivedAt:
      value.archivedAt === null
        ? null
        : requireIsoTimestamp(value.archivedAt, "item.archivedAt")
  };
}

function normalizeCompletions(
  value: unknown,
  itemIds: Set<string>
): Record<string, Record<IsoDate, Completion>> {
  if (!isRecord(value)) {
    throw new Error("completions must be an object.");
  }

  const completions: Record<string, Record<IsoDate, Completion>> = {};

  for (const itemId of itemIds) {
    completions[itemId] = {};
  }

  for (const [itemId, days] of Object.entries(value)) {
    if (!itemIds.has(itemId)) {
      throw new Error(`Completion data references an unknown item: ${itemId}.`);
    }

    if (!isRecord(days)) {
      throw new Error(`Completion data for ${itemId} must be an object.`);
    }

    for (const [date, completion] of Object.entries(days)) {
      completions[itemId][requireIsoDate(date)] =
        normalizeCompletion(completion);
    }
  }

  return completions;
}

function normalizeCompletion(value: unknown): Completion {
  if (!isRecord(value)) {
    throw new Error("Completion entries must be objects.");
  }

  const source = value.source === "import" ? "import" : "manual";

  return {
    completedAt: requireIsoTimestamp(value.completedAt, "completedAt"),
    source
  };
}

function collectImportWarnings(data: StreakData): string[] {
  const warnings: string[] = [];
  const seenNames = new Set<string>();

  for (const item of data.items) {
    const normalized = item.name.trim().toLowerCase();

    if (seenNames.has(normalized)) {
      warnings.push(`Duplicate item name: ${item.name}.`);
    }

    seenNames.add(normalized);
  }

  return warnings;
}

function countCompletions(
  completions: Record<string, Record<IsoDate, Completion>>
): number {
  return Object.values(completions).reduce(
    (total, itemCompletions) => total + Object.keys(itemCompletions).length,
    0
  );
}

function requireString(value: unknown, label: string, maxLength?: number): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  return requireMaxLength(value, label, maxLength).trim();
}

function requireMaxLength(value: string, label: string, maxLength?: number) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }

  if (maxLength && trimmed.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or less.`);
  }

  return trimmed;
}

function requireOptionalString(value: string, label: string, maxLength: number) {
  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or less.`);
  }

  return trimmed;
}

function requireIsoTimestamp(value: unknown, label: string): string {
  const timestamp = requireString(value, label);

  if (Number.isNaN(Date.parse(timestamp))) {
    throw new Error(`${label} must be an ISO timestamp.`);
  }

  return timestamp;
}

function requireIsoDate(value: string): IsoDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Expected YYYY-MM-DD completion date, received: ${value}.`);
  }

  return value as IsoDate;
}

function requireNonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }

  return value;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value;
}
