import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createEmptyStreakData } from "./model";
import { LocalStreakStorageAdapter, STREAK_STORAGE_KEY } from "./storage";

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

function loadStoredPayload(payload: unknown) {
  const storage = new MemoryStorage();
  storage.setItem(
    STREAK_STORAGE_KEY,
    typeof payload === "string" ? payload : JSON.stringify(payload)
  );

  return new LocalStreakStorageAdapter(storage).load();
}

describe("Streak store recovery", () => {
  it("recovers to an empty state when stored JSON is invalid", () => {
    const recovered = loadStoredPayload("{not json");

    assert.equal(recovered.schemaVersion, 1);
    assert.deepEqual(recovered.items, []);
    assert.deepEqual(recovered.completions, {});
  });

  it("recovers to an empty state when stored data has no schema version", () => {
    const missingVersion: Record<string, unknown> = {
      ...createEmptyStreakData(new Date("2026-05-27T12:00:00.000Z"))
    };
    delete missingVersion.schemaVersion;

    const recovered = loadStoredPayload(missingVersion);

    assert.equal(recovered.schemaVersion, 1);
    assert.deepEqual(recovered.items, []);
  });

  it("recovers to the current empty schema when stored data has a future version", () => {
    const recovered = loadStoredPayload({
      ...createEmptyStreakData(new Date("2026-05-27T12:00:00.000Z")),
      schemaVersion: 2
    });

    assert.equal(recovered.schemaVersion, 1);
    assert.deepEqual(recovered.items, []);
    assert.deepEqual(recovered.preferences, createEmptyStreakData().preferences);
  });

  it("recovers when completion data references a missing streak item", () => {
    const recovered = loadStoredPayload({
      ...createEmptyStreakData(new Date("2026-05-27T12:00:00.000Z")),
      completions: {
        missing: {
          "2026-05-27": {
            completedAt: "2026-05-27T12:00:00.000Z"
          }
        }
      }
    });

    assert.deepEqual(recovered.items, []);
    assert.deepEqual(recovered.completions, {});
  });

  it("recovers when preferences have unsupported values", () => {
    const recovered = loadStoredPayload({
      ...createEmptyStreakData(new Date("2026-05-27T12:00:00.000Z")),
      preferences: {
        theme: "sepia",
        weekStartsOn: 7,
        gridWindowDays: -1,
        showArchived: "yes",
        accentColor: ""
      }
    });

    assert.deepEqual(recovered.preferences, {
      ...createEmptyStreakData().preferences,
      gridWindowDays: 7
    });
  });
});
