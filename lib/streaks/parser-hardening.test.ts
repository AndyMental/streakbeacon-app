import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LocalStreakStorageAdapter,
  STREAK_STORAGE_KEY,
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

describe("Parser Hardening Regression", () => {
  it("does not archive legacy items that are missing the archivedAt field", () => {
    const storage = new MemoryStorage();
    const adapter = new LocalStreakStorageAdapter(storage);

    // Legacy data missing schemaVersion and archivedAt
    const legacyData = {
      items: [
        {
          id: "legacy-item",
          name: "Legacy Item",
          createdAt: "2026-05-27T12:00:00.000Z",
          updatedAt: "2026-05-27T12:00:00.000Z",
          order: 0
        }
      ],
      createdAt: "2026-05-27T12:00:00.000Z",
      updatedAt: "2026-05-27T12:00:00.000Z",
      completions: {},
      preferences: {}
    };

    storage.setItem(STREAK_STORAGE_KEY, JSON.stringify(legacyData));

    const loaded = adapter.load();
    const item = loaded.items.find(i => i.id === "legacy-item");
    assert.ok(item, "Item should be loaded");
    assert.equal(item.archivedAt, null, "Item should not be archived");
  });

  it("skips malformed items and items missing IDs, recovering the rest in lenient mode", () => {
    const storage = new MemoryStorage();
    const adapter = new LocalStreakStorageAdapter(storage);

    const messyData = {
      items: [
        { name: "Missing ID", order: 0 }, // Missing ID
        "not an object", // Malformed item
        { id: "valid", name: "Valid", order: 1 } // Valid item
      ],
      createdAt: "invalid-date", // Malformed date
      completions: {
        "valid": { "2026-05-27": { completedAt: "invalid" } },
        "unknown": { "2026-05-27": { completedAt: "2026-05-27T12:00:00.000Z" } }
      }
    };

    storage.setItem(STREAK_STORAGE_KEY, JSON.stringify(messyData));

    const loaded = adapter.load();

    assert.equal(loaded.items.length, 1, "Should recover 1 valid item and skip the malformed ones");
    assert.ok(loaded.items.find(i => i.id === "valid"), "Should recover valid item");

    assert.ok(!Number.isNaN(Date.parse(loaded.createdAt)), "Should fall back to a valid createdAt date");

    assert.ok(loaded.completions["valid"]["2026-05-27"], "Should keep completion for valid item");
    assert.ok(!loaded.completions["unknown"], "Should skip unknown item completions");
  });

  it("deduplicates items by ID in lenient mode", () => {
    const storage = new MemoryStorage();
    const adapter = new LocalStreakStorageAdapter(storage);

    const duplicateData = {
      items: [
        { id: "dup", name: "First", order: 0 },
        { id: "dup", name: "Second", order: 1 }
      ]
    };

    storage.setItem(STREAK_STORAGE_KEY, JSON.stringify(duplicateData));

    const loaded = adapter.load();
    assert.equal(loaded.items.length, 1, "Should deduplicate items");
    assert.equal(loaded.items[0].name, "First", "Should take the first one encountered");
  });

  it("does not archive legacy items that have malformed archivedAt values in lenient mode", () => {
    const storage = new MemoryStorage();
    const adapter = new LocalStreakStorageAdapter(storage);

    const legacyData = {
      items: [
        {
          id: "malformed-archive-item",
          name: "Malformed Archive Item",
          createdAt: "2026-05-27T12:00:00.000Z",
          updatedAt: "2026-05-27T12:00:00.000Z",
          archivedAt: "not-a-date", // Malformed archivedAt
          order: 0
        }
      ]
    };

    storage.setItem(STREAK_STORAGE_KEY, JSON.stringify(legacyData));

    const loaded = adapter.load();
    const item = loaded.items.find(i => i.id === "malformed-archive-item");
    assert.ok(item, "Item should be loaded");
    assert.equal(item.archivedAt, null, "Malformed archivedAt should default to null in lenient mode to keep item active");
  });

  it("skips items with blank IDs or names in lenient mode", () => {
    const storage = new MemoryStorage();
    const adapter = new LocalStreakStorageAdapter(storage);

    const blankData = {
      items: [
        { id: "  ", name: "Valid Name", order: 0 },
        { id: "valid-id", name: "", order: 1 }
      ]
    };

    storage.setItem(STREAK_STORAGE_KEY, JSON.stringify(blankData));

    const loaded = adapter.load();
    assert.equal(loaded.items.length, 0, "Should skip items with blank fields");
  });

  it("initializes empty completions for all items when field is missing in lenient mode", () => {
    const storage = new MemoryStorage();
    const adapter = new LocalStreakStorageAdapter(storage);

    const noCompletionsData = {
      items: [
        { id: "item-1", name: "Item 1", order: 0 }
      ]
      // completions field is missing
    };

    storage.setItem(STREAK_STORAGE_KEY, JSON.stringify(noCompletionsData));

    const loaded = adapter.load();
    assert.ok(loaded.completions["item-1"], "Should initialize empty completions for item-1");
    assert.deepEqual(loaded.completions["item-1"], {}, "Completions for item-1 should be empty object");
  });
});
