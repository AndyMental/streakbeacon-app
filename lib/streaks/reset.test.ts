import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addStreakItem, createEmptyStreakData } from "./model";
import {
  cancelResetAllData,
  confirmResetAllData,
  dispatchStreakDataReset,
} from "./reset";
import {
  LocalStreakStorageAdapter,
  STREAK_DATA_CHANGED_EVENT,
  STREAK_STORAGE_KEY,
} from "./storage";
import { StreakStore } from "./store";

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

describe("reset-all-data flow", () => {
  it("confirm clears storage and returns an empty first-run state", () => {
    const storage = new MemoryStorage();
    const store = new StreakStore(new LocalStreakStorageAdapter(storage));
    const now = new Date("2026-05-27T12:00:00.000Z");

    store.createItem({ id: "read", name: "Read", now });
    assert.notEqual(storage.getItem(STREAK_STORAGE_KEY), null);

    const next = confirmResetAllData(store, now);

    assert.equal(storage.getItem(STREAK_STORAGE_KEY), null);
    assert.deepEqual(next.items, []);
    assert.deepEqual(store.getSnapshot().items, []);
  });

  it("cancel leaves storage and in-memory data intact", () => {
    const storage = new MemoryStorage();
    const store = new StreakStore(new LocalStreakStorageAdapter(storage));
    const now = new Date("2026-05-27T12:00:00.000Z");
    const current = addStreakItem(createEmptyStreakData(now), {
      id: "ship",
      name: "Ship",
      now,
    });

    store.replaceData(current, now);
    const storedBefore = storage.getItem(STREAK_STORAGE_KEY);

    const next = cancelResetAllData(current);

    assert.equal(storage.getItem(STREAK_STORAGE_KEY), storedBefore);
    assert.deepEqual(next, current);
    assert.equal(store.getSnapshot().items[0]?.id, "ship");
  });

  it("dispatches the existing data-changed browser event after confirmed reset", () => {
    const target = new EventTarget();
    let calls = 0;

    target.addEventListener(STREAK_DATA_CHANGED_EVENT, () => {
      calls += 1;
    });

    dispatchStreakDataReset(target);

    assert.equal(calls, 1);
  });
});
