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

  it("recovers partially from malformed items and missing IDs in lenient mode", () => {
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
    
    assert.equal(loaded.items.length, 2, "Should recover 2 items");
    assert.ok(loaded.items.find(i => i.name === "Missing ID"), "Should recover item with missing ID");
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
});
