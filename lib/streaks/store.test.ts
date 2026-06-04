import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addStreakItem,
  createEmptyStreakData,
  setDayCompletion,
} from "./model";
import { LocalStreakStorageAdapter, STREAK_STORAGE_KEY } from "./storage";
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

class WriteThrowingStorage extends MemoryStorage {
  setItem(): void {
    throw new Error("Storage quota exceeded.");
  }
}

describe("StreakStore", () => {
  it("hydrates an empty snapshot when local storage has no persisted state", () => {
    const storage = new MemoryStorage();
    const store = new StreakStore(new LocalStreakStorageAdapter(storage));
    const snapshot = store.getSnapshot();

    assert.deepEqual(snapshot.items, []);
    assert.deepEqual(snapshot.completions, {});
    assert.equal(snapshot.preferences.theme, "system");
    assert.equal(storage.getItem(STREAK_STORAGE_KEY), null);
  });

  it("hydrates an empty snapshot when persisted state is malformed or corrupt", () => {
    const storage = new MemoryStorage();
    const store = new StreakStore(new LocalStreakStorageAdapter(storage));

    storage.setItem(STREAK_STORAGE_KEY, "{not json");
    assert.deepEqual(store.getSnapshot().items, []);

    storage.setItem(
      STREAK_STORAGE_KEY,
      JSON.stringify({
        ...createEmptyStreakData(),
        items: [{ id: "missing-fields" }],
      })
    );
    const recovered = store.getSnapshot();

    assert.deepEqual(recovered.items, []);
    assert.deepEqual(recovered.completions, {});
    assert.equal(recovered.preferences.theme, "system");
  });

  it("keeps write failures non-fatal and returns the app-layer update", () => {
    const storage = new WriteThrowingStorage();
    const store = new StreakStore(new LocalStreakStorageAdapter(storage));
    const now = new Date("2026-05-27T12:00:00.000Z");

    let updated = createEmptyStreakData(now);
    assert.doesNotThrow(() => {
      updated = store.createItem({ id: "hydrate", name: "Hydrate", now });
    });

    assert.equal(updated.items[0]?.id, "hydrate");
    assert.equal(updated.completions.hydrate !== undefined, true);
    assert.equal(storage.getItem(STREAK_STORAGE_KEY), null);
    assert.deepEqual(store.getSnapshot().items, []);
  });

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
    assert.equal(storage.getItem("streakbeacon:data:v1"), null);
  });

  it("merges partial data into the existing store", () => {
    const storage = new MemoryStorage();
    const store = new StreakStore(new LocalStreakStorageAdapter(storage));
    const now = new Date("2026-05-27T12:00:00.000Z");
    const later = new Date("2026-05-27T13:00:00.000Z");

    store.createItem({ id: "hydrate", name: "Hydrate", now });
    store.setCompletion("hydrate", "2026-05-27", true, now);

    const incoming = addStreakItem(createEmptyStreakData(later), {
      id: "walk",
      name: "Walk",
      now: later,
    });
    const withCompletion = setDayCompletion(
      incoming,
      "walk",
      "2026-05-27",
      true,
      later
    );

    store.mergeData(withCompletion, later);

    const snapshot = store.getSnapshot();
    assert.equal(snapshot.items.length, 2);
    assert.ok(snapshot.items.find((i) => i.id === "hydrate"));
    assert.ok(snapshot.items.find((i) => i.id === "walk"));
    assert.ok(snapshot.completions.hydrate["2026-05-27"]);
    assert.ok(snapshot.completions.walk["2026-05-27"]);
  });

  it("removes a streak item and persists the remaining active items", () => {
    const storage = new MemoryStorage();
    const store = new StreakStore(new LocalStreakStorageAdapter(storage));
    const now = new Date("2026-05-27T12:00:00.000Z");

    store.createItem({ id: "hydrate", name: "Hydrate", now });
    store.createItem({ id: "walk", name: "Walk", now });
    store.setCompletion("hydrate", "2026-05-27", true, now);

    const afterDelete = store.deleteItem("hydrate", now);
    const remainingActive = afterDelete.items.filter(
      (item) => !item.archivedAt
    );

    assert.equal(remainingActive.length, 1);
    assert.equal(remainingActive[0]?.id, "walk");

    const reloaded = new StreakStore(new LocalStreakStorageAdapter(storage));
    const snapshot = reloaded.getSnapshot();
    const reloadedActive = snapshot.items.filter((item) => !item.archivedAt);

    assert.equal(reloadedActive.length, 1);
    assert.equal(reloadedActive[0]?.id, "walk");
    assert.equal(snapshot.completions.hydrate, undefined);
  });

  it("archives and unarchives a streak item and persists the state", () => {
    const storage = new MemoryStorage();
    const store = new StreakStore(new LocalStreakStorageAdapter(storage));
    const now = new Date("2026-05-27T12:00:00.000Z");

    store.createItem({ id: "hydrate", name: "Hydrate", now });
    store.archiveItem("hydrate", now);

    const reloaded = new StreakStore(new LocalStreakStorageAdapter(storage));
    let snapshot = reloaded.getSnapshot();
    assert.equal(snapshot.items[0]?.id, "hydrate");
    assert.equal(snapshot.items[0]?.archivedAt, now.toISOString());

    store.unarchiveItem("hydrate", now);
    snapshot = store.getSnapshot();
    assert.equal(snapshot.items[0]?.archivedAt, null);
  });

  it("keeps reset idempotent across repeated calls", () => {
    const storage = new MemoryStorage();
    const store = new StreakStore(new LocalStreakStorageAdapter(storage));
    const now = new Date("2026-05-27T12:00:00.000Z");

    store.createItem({ id: "hydrate", name: "Hydrate", now });
    store.reset();
    store.reset();

    assert.deepEqual(store.getSnapshot().items, []);
    assert.equal(store.getSnapshot().preferences.theme, "system");
  });

  it("persists a first-run in-memory snapshot before saving a toggle", () => {
    const storage = new MemoryStorage();
    const store = new StreakStore(new LocalStreakStorageAdapter(storage));
    const now = new Date("2026-05-27T12:00:00.000Z");
    const demo = addStreakItem(createEmptyStreakData(now), {
      id: "ship-useful-change",
      name: "Ship one useful change",
      now,
    });

    const toggled = setDayCompletion(
      demo,
      "ship-useful-change",
      "2026-05-27",
      true,
      now
    );
    store.replaceData(toggled, now);

    const reloaded = new StreakStore(new LocalStreakStorageAdapter(storage));
    const snapshot = reloaded.getSnapshot();

    assert.equal(snapshot.items[0]?.id, "ship-useful-change");
    assert.equal(
      snapshot.completions["ship-useful-change"]?.["2026-05-27"]?.source,
      "manual"
    );
  });
});
