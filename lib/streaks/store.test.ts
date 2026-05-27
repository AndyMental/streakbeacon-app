import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LocalStreakStorageAdapter } from "./storage";
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

describe("StreakStore", () => {
  it("persists app-layer operations through the storage adapter", () => {
    const storage = new MemoryStorage();
    const store = new StreakStore(new LocalStreakStorageAdapter(storage));
    const now = new Date("2026-05-27T12:00:00.000Z");

    store.createItem({ id: "hydrate", name: "Hydrate", now });
    store.setCompletion("hydrate", "2026-05-27", true, now);
    store.updatePreferences({ theme: "dark", weekStartsOn: 1 }, now);

    const reloaded = new StreakStore(new LocalStreakStorageAdapter(storage));
    const snapshot = reloaded.getSnapshot();

    assert.equal(snapshot.items[0]?.name, "Hydrate");
    assert.deepEqual(Object.keys(snapshot.completions.hydrate), ["2026-05-27"]);
    assert.equal(snapshot.preferences.theme, "dark");
    assert.equal(snapshot.preferences.weekStartsOn, 1);
  });

  it("replaces imported data and resets back to an empty local state", () => {
    const storage = new MemoryStorage();
    const store = new StreakStore(new LocalStreakStorageAdapter(storage));
    const now = new Date("2026-05-27T12:00:00.000Z");

    const imported = store.createItem({ id: "ship", name: "Ship", now });
    store.replaceData(imported, now);
    assert.equal(store.getSnapshot().items[0]?.id, "ship");

    store.reset();
    assert.deepEqual(store.getSnapshot().items, []);
  });
});
