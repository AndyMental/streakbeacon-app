import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyThemePreference, readThemePreference } from "./theme-preference";

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

describe("theme preference helpers", () => {
  it("defaults to the system theme when storage is empty", () => {
    assert.equal(readThemePreference(new MemoryStorage()), "system");
  });

  it("round trips light, dark, and system selections through storage", () => {
    const storage = new MemoryStorage();

    for (const theme of ["light", "dark", "system"] as const) {
      assert.equal(applyThemePreference(storage, theme), theme);
      assert.equal(readThemePreference(storage), theme);
    }
  });

  it("overwrites a previously persisted selection without touching other preferences", () => {
    const storage = new MemoryStorage();

    applyThemePreference(storage, "dark");
    applyThemePreference(storage, "light");

    const snapshot = readThemePreference(storage);
    assert.equal(snapshot, "light");
  });
});
