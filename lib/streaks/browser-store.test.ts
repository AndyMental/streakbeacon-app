import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createBrowserStreakStore,
  DASHBOARD_STORAGE_UNAVAILABLE_MESSAGE,
  resolveBrowserStreakStore,
  SETTINGS_STORAGE_UNAVAILABLE_MESSAGE,
  STORAGE_UNAVAILABLE_TITLE
} from "./browser-store";
import { addStreakItem, createEmptyStreakData } from "./model";

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

describe("browser streak storage", () => {
  it("creates a store from available browser storage", () => {
    const store = createBrowserStreakStore(new MemoryStorage());
    const now = new Date("2026-05-27T12:00:00.000Z");
    const data = addStreakItem(createEmptyStreakData(now), {
      id: "hydrate",
      name: "Hydrate",
      now
    });

    store.replaceData(data, now);

    assert.equal(store.getSnapshot().items[0]?.name, "Hydrate");
  });

  it("returns the dashboard storage-unavailable alert when storage access fails", () => {
    const result = resolveBrowserStreakStore(() => {
      throw new Error("localStorage access denied");
    }, DASHBOARD_STORAGE_UNAVAILABLE_MESSAGE);

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.deepEqual(result.alert, {
        title: STORAGE_UNAVAILABLE_TITLE,
        description: DASHBOARD_STORAGE_UNAVAILABLE_MESSAGE
      });
    }
  });

  it("returns the settings storage-unavailable alert when storage access fails", () => {
    const result = resolveBrowserStreakStore(() => {
      throw new Error("localStorage access denied");
    }, SETTINGS_STORAGE_UNAVAILABLE_MESSAGE);

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.deepEqual(result.alert, {
        title: STORAGE_UNAVAILABLE_TITLE,
        description: SETTINGS_STORAGE_UNAVAILABLE_MESSAGE
      });
    }
  });
});
