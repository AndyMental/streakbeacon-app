import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LocalStreakStorageAdapter, STREAK_STORAGE_KEY } from "./storage";
import { STREAK_DATA_VERSION } from "./model";

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

describe("Data Migration", () => {
  it("migrates v0 data (missing schemaVersion) to current version", () => {
    const storage = new MemoryStorage();
    // v0 data: no schemaVersion
    const v0Data = {
      createdAt: "2026-05-01T10:00:00.000Z",
      updatedAt: "2026-05-01T10:00:00.000Z",
      items: [
        {
          id: "task-1",
          name: "Task 1",
          description: "V0 Task",
          color: "#FF0000",
          createdAt: "2026-05-01T10:00:00.000Z",
          updatedAt: "2026-05-01T10:00:00.000Z",
          order: 0,
          archivedAt: null,
        },
      ],
      completions: {
        "task-1": {
          "2026-05-01": { completedAt: "2026-05-01T10:00:00.000Z" },
        },
      },
      preferences: {
        theme: "light",
        weekStartsOn: 0,
        gridWindowDays: 365,
        showArchived: false,
        accentColor: "#27AE60",
      },
    };

    storage.setItem(STREAK_STORAGE_KEY, JSON.stringify(v0Data));
    const adapter = new LocalStreakStorageAdapter(storage);

    const loaded = adapter.load();
    assert.equal(loaded.schemaVersion, STREAK_DATA_VERSION);
    assert.equal(loaded.items.length, 1);
    assert.equal(loaded.items[0].name, "Task 1");
    assert.ok(loaded.completions["task-1"]["2026-05-01"]);
  });

  it("migrates v1 data to current version", () => {
    const storage = new MemoryStorage();
    const v1Data = {
      schemaVersion: 1,
      createdAt: "2026-05-01T10:00:00.000Z",
      updatedAt: "2026-05-01T10:00:00.000Z",
      items: [],
      completions: {},
      preferences: {},
    };

    storage.setItem(STREAK_STORAGE_KEY, JSON.stringify(v1Data));
    const adapter = new LocalStreakStorageAdapter(storage);

    const loaded = adapter.load();
    assert.equal(loaded.schemaVersion, STREAK_DATA_VERSION);
  });

  it("handles malformed data by falling back to empty state but with current version", () => {
    const storage = new MemoryStorage();
    storage.setItem(STREAK_STORAGE_KEY, "invalid json");
    const adapter = new LocalStreakStorageAdapter(storage);

    const loaded = adapter.load();
    assert.equal(loaded.schemaVersion, STREAK_DATA_VERSION);
    assert.equal(loaded.items.length, 0);
  });
});
