import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addStreakItem,
  createEmptyStreakData,
  setDayCompletion
} from "./model";
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

describe("LocalStreakStorageAdapter", () => {
  it("returns an empty state when storage has no data", () => {
    const adapter = new LocalStreakStorageAdapter(new MemoryStorage());

    assert.deepEqual(adapter.load(), createEmptyStreakData());
  });

  it("round trips streak data through key/value storage", () => {
    const storage = new MemoryStorage();
    const adapter = new LocalStreakStorageAdapter(storage);
    const now = new Date("2026-05-27T12:00:00.000Z");
    const data = setDayCompletion(
      addStreakItem(createEmptyStreakData(), {
        id: "read",
        name: "Read",
        now
      }),
      "read",
      "2026-05-27",
      true,
      now
    );

    adapter.save(data, now);

    assert.deepEqual(adapter.load(), data);
  });

  it("falls back to empty state for unsupported versions", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      STREAK_STORAGE_KEY,
      JSON.stringify({
        app: "streakbeacon",
        dataVersion: 99,
        savedAt: "2026-05-27T12:00:00.000Z",
        data: createEmptyStreakData()
      })
    );
    const adapter = new LocalStreakStorageAdapter(storage);

    assert.deepEqual(adapter.load(), createEmptyStreakData());
  });

  it("falls back to empty state for invalid or corrupt data", () => {
    const storage = new MemoryStorage();
    storage.setItem(STREAK_STORAGE_KEY, "{not json");
    const adapter = new LocalStreakStorageAdapter(storage);

    assert.deepEqual(adapter.load(), createEmptyStreakData());

    storage.setItem(
      STREAK_STORAGE_KEY,
      JSON.stringify({
        app: "streakbeacon",
        dataVersion: 1,
        savedAt: "2026-05-27T12:00:00.000Z",
        data: { items: "not an array", preferences: {} }
      })
    );

    assert.deepEqual(adapter.load(), createEmptyStreakData());
  });

  it("deletes saved data on reset", () => {
    const storage = new MemoryStorage();
    const adapter = new LocalStreakStorageAdapter(storage);

    adapter.save(createEmptyStreakData());
    assert.notEqual(storage.getItem(STREAK_STORAGE_KEY), null);

    adapter.reset();

    assert.equal(storage.getItem(STREAK_STORAGE_KEY), null);
    assert.deepEqual(adapter.load(), createEmptyStreakData());
  });
});
