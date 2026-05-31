import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addStreakItem,
  createEmptyStreakData,
  setDayCompletion,
  updatePreferences
} from "./model";
import {
  assertStorageWritable,
  LocalStreakStorageAdapter,
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

class WriteThrowingStorage extends MemoryStorage {
  setItem(): void {
    throw new Error("Storage quota exceeded.");
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

  it("detects writable storage and removes a new probe key", () => {
    const storage = new MemoryStorage();

    assert.doesNotThrow(() => assertStorageWritable(storage, "probe"));
    assert.equal(storage.getItem("probe"), null);
  });

  it("restores an existing probe key value", () => {
    const storage = new MemoryStorage();

    storage.setItem("probe", "existing");
    assert.doesNotThrow(() => assertStorageWritable(storage, "probe"));
    assert.equal(storage.getItem("probe"), "existing");
  });

  it("throws when storage cannot persist writes", () => {
    assert.throws(() => assertStorageWritable(new WriteThrowingStorage()));
    assert.throws(() => assertStorageWritable(new ThrowingStorage()));
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
      true
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
