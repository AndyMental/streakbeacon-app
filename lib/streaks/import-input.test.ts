import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateImportText } from "./storage";
import { STREAK_DATA_VERSION, STREAK_EXPORT_FORMAT } from "./model";

describe("validateImportText", () => {
  const validEnvelope = {
    format: STREAK_EXPORT_FORMAT,
    formatVersion: STREAK_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    app: { name: "StreakBeacon" },
    data: {
      schemaVersion: STREAK_DATA_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: "test-item",
          name: "Test Item",
          description: "A test item",
          color: "#27AE60",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: 0,
          archivedAt: null
        }
      ],
      completions: {
        "test-item": {
          "2026-05-31": {
            completedAt: new Date().toISOString(),
            source: "manual"
          }
        }
      },
      preferences: {
        theme: "dark",
        weekStartsOn: 0,
        gridWindowDays: 365,
        showArchived: false,
        accentColor: "#27AE60"
      }
    }
  };

  it("accepts a valid export JSON", () => {
    const result = validateImportText(JSON.stringify(validEnvelope));
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.preview.itemCount, 1);
      assert.equal(result.preview.completionCount, 1);
      assert.equal(result.preview.preferenceCount, 5);
      assert.equal(result.preview.warnings.length, 0);
    }
  });

  it("rejects non-JSON input", () => {
    const result = validateImportText("not json");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.some(e => e.includes("valid JSON")));
    }
  });

  it("rejects wrong format", () => {
    const invalid = { ...validEnvelope, format: "wrong.format" };
    const result = validateImportText(JSON.stringify(invalid));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.some(e => e.includes("not a StreakBeacon export")));
    }
  });

  it("rejects wrong version", () => {
    const invalid = { ...validEnvelope, formatVersion: 999 };
    const result = validateImportText(JSON.stringify(invalid));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.some(e => e.includes("version is not supported")));
    }
  });

  it("detects duplicate names and provides warnings", () => {
    const withDuplicates = JSON.parse(JSON.stringify(validEnvelope));
    withDuplicates.data.items.push({
      ...withDuplicates.data.items[0],
      id: "another-id"
    });
    const result = validateImportText(JSON.stringify(withDuplicates));
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.preview.warnings.length, 1);
      assert.ok(result.preview.warnings[0].includes("Duplicate item name"));
    }
  });
});
