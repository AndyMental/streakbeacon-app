import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addStreakItem,
  createEmptyStreakData,
  setDayCompletion,
  updatePreferences
} from "./model";
import {
  LocalStreakStorageAdapter,
  parseExportEnvelope,
  STREAK_STORAGE_KEY,
  validateImportText
} from "./storage";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

class ThrowingStorage {
  getItem(): string | null {
    throw new Error("Storage access denied.");
  }

  setItem(): void {
    throw new Error("Storage quota exceeded.");
  }

  removeItem(): void {
    throw new Error("Storage access denied.");
  }
}

function createSampleData() {
  const now = new Date("2026-05-27T12:00:00.000Z");

  return setDayCompletion(
    updatePreferences(
      addStreakItem(createEmptyStreakData(now), {
        id: "read",
        name: "Read",
        now
      }),
      { theme: "dark" },
      now
    ),
    "read",
    "2026-05-27",
    true,
    now
  );
}

describe("LocalStreakStorageAdapter", () => {
  it("returns an empty state when storage has no data", () => {
    const adapter = new LocalStreakStorageAdapter(new MemoryStorage());

    assert.equal(adapter.load().items.length, 0);
    assert.equal(adapter.load().preferences.theme, "system");
  });

  it("round trips streak data through key/value storage", () => {
    const storage = new MemoryStorage();
    const adapter = new LocalStreakStorageAdapter(storage);
    const data = createSampleData();

    adapter.save(data, new Date("2026-05-27T12:00:00.000Z"));

    assert.deepEqual(adapter.load(), data);
  });

  it("falls back to empty state for unsupported versions", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      STREAK_STORAGE_KEY,
      JSON.stringify({
        ...createEmptyStreakData(),
        schemaVersion: 99
      })
    );
    const adapter = new LocalStreakStorageAdapter(storage);

    assert.equal(adapter.load().schemaVersion, 1);
    assert.deepEqual(adapter.load().items, []);
  });

  it("falls back to empty state for invalid or corrupt data", () => {
    const storage = new MemoryStorage();
    storage.setItem(STREAK_STORAGE_KEY, "{not json");
    const adapter = new LocalStreakStorageAdapter(storage);

    assert.deepEqual(adapter.load().items, []);

    storage.setItem(
      STREAK_STORAGE_KEY,
      JSON.stringify({
        ...createEmptyStreakData(),
        items: "not an array"
      })
    );

    assert.deepEqual(adapter.load().items, []);
  });

  it("deletes saved data on reset", () => {
    const storage = new MemoryStorage();
    const adapter = new LocalStreakStorageAdapter(storage);

    adapter.save(createSampleData());
    assert.notEqual(storage.getItem(STREAK_STORAGE_KEY), null);

    adapter.reset();

    assert.equal(storage.getItem(STREAK_STORAGE_KEY), null);
    assert.deepEqual(adapter.load().items, []);
  });

  it("keeps storage API failures non-fatal", () => {
    const adapter = new LocalStreakStorageAdapter(new ThrowingStorage());
    const data = createSampleData();

    assert.deepEqual(adapter.load(), createEmptyStreakData());
    assert.doesNotThrow(() =>
      adapter.save(data, new Date("2026-05-27T12:00:00.000Z"))
    );
    assert.deepEqual(
      adapter.replace(data, new Date("2026-05-27T12:00:00.000Z")),
      data
    );
    assert.doesNotThrow(() => adapter.reset());
  });

  it("uses the configured storage key and normalizes saved payloads", () => {
    const storage = new MemoryStorage();
    const adapter = new LocalStreakStorageAdapter(storage, "custom:key");
    const data = {
      ...createSampleData(),
      completions: {
        read: {
          "2026-05-27": {
            completedAt: "2026-05-27T12:00:00.000Z",
            source: "unexpected"
          }
        }
      }
    };

    adapter.save(data, new Date("2026-05-27T14:00:00.000Z"));

    assert.equal(storage.getItem(STREAK_STORAGE_KEY), null);
    assert.equal(adapter.load().updatedAt, "2026-05-27T14:00:00.000Z");
    assert.equal(
      adapter.load().completions.read["2026-05-27"]?.source,
      "manual"
    );
  });

  it("exports and validates a restorable JSON payload", () => {
    const adapter = new LocalStreakStorageAdapter(new MemoryStorage());
    const exported = adapter.export(
      createSampleData(),
      new Date("2026-05-27T13:00:00.000Z")
    );
    const result = validateImportText(JSON.stringify(exported));

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.preview.itemCount, 1);
      assert.equal(result.preview.completionCount, 1);
      assert.equal(result.preview.data.preferences.theme, "dark");
    }
  });

  it("reports invalid JSON, wrong format, unsupported version, duplicate ids, and unknown completion references", () => {
    const adapter = new LocalStreakStorageAdapter(new MemoryStorage());
    const exported = adapter.export(createSampleData());

    assert.deepEqual(validateImportText("{bad").ok, false);
    assert.deepEqual(
      validateImportText(JSON.stringify({ ...exported, format: "other" })).ok,
      false
    );
    assert.deepEqual(
      validateImportText(JSON.stringify({ ...exported, formatVersion: 99 })).ok,
      false
    );
    assert.deepEqual(
      validateImportText(
        JSON.stringify({
          ...exported,
          data: {
            ...exported.data,
            items: [exported.data.items[0], exported.data.items[0]]
          }
        })
      ).ok,
      false
    );
    assert.deepEqual(
      validateImportText(
        JSON.stringify({
          ...exported,
          data: {
            ...exported.data,
            completions: {
              ...exported.data.completions,
              missing: {}
            }
          }
        })
      ).ok,
      false
    );
  });

  it("rejects malformed import metadata and completion structures", () => {
    const adapter = new LocalStreakStorageAdapter(new MemoryStorage());
    const exported = adapter.export(createSampleData());

    assert.deepEqual(
      validateImportText(JSON.stringify({ ...exported, app: { name: "Other" } }))
        .ok,
      false
    );
    assert.deepEqual(
      validateImportText(
        JSON.stringify({ ...exported, exportedAt: "not a date" })
      ).ok,
      false
    );
    assert.deepEqual(
      validateImportText(
        JSON.stringify({
          ...exported,
          data: {
            ...exported.data,
            completions: {
              read: []
            }
          }
        })
      ).ok,
      false
    );
  });

  it("normalizes accepted import payload fields for local-first restores", () => {
    const adapter = new LocalStreakStorageAdapter(new MemoryStorage());
    const exported = adapter.export(createSampleData());
    const result = parseExportEnvelope({
      ...exported,
      data: {
        ...exported.data,
        preferences: {
          theme: "invalid",
          weekStartsOn: 3,
          gridWindowDays: 999,
          showArchived: "yes",
          accentColor: " #2D9CDB "
        },
        items: [
          {
            ...exported.data.items[0],
            description: 123,
            color: " "
          }
        ],
        completions: {
          read: {
            "2026-05-27": {
              completedAt: "2026-05-27T12:00:00.000Z",
              source: "import"
            }
          }
        }
      }
    });

    assert.equal(result.envelope.data.preferences.theme, "system");
    assert.equal(result.envelope.data.preferences.weekStartsOn, 0);
    assert.equal(result.envelope.data.preferences.gridWindowDays, 365);
    assert.equal(result.envelope.data.preferences.showArchived, false);
    assert.equal(result.envelope.data.preferences.accentColor, "#2D9CDB");
    assert.equal(result.envelope.data.items[0]?.description, "");
    assert.equal(result.envelope.data.items[0]?.color, "#27AE60");
    assert.equal(
      result.envelope.data.completions.read["2026-05-27"]?.source,
      "import"
    );
  });

  it("allows duplicate imported names as preview warnings", () => {
    const adapter = new LocalStreakStorageAdapter(new MemoryStorage());
    const now = new Date("2026-05-27T12:00:00.000Z");
    const first = addStreakItem(createEmptyStreakData(now), {
      id: "read-a",
      name: "Read",
      now
    });
    const data = addStreakItem(first, {
      id: "read-b",
      name: "read",
      now
    });
    const result = validateImportText(JSON.stringify(adapter.export(data)));

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.deepEqual(result.preview.warnings, ["Duplicate item name: read."]);
    }
  });
});
