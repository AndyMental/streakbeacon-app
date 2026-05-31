import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertIsoDate, createStreakItem, normalizePreferences } from "./model";
import { validateImportText } from "./storage";

describe("extended validation", () => {
  describe("assertIsoDate", () => {
    it("accepts valid calendar dates", () => {
      assert.doesNotThrow(() => assertIsoDate("2026-05-31"));
      assert.doesNotThrow(() => assertIsoDate("2024-02-29")); // Leap year
    });

    it("rejects malformed dates", () => {
      assert.throws(() => assertIsoDate("2026/05/31"), /Expected YYYY-MM-DD/);
      assert.throws(() => assertIsoDate("31-05-2026"), /Expected YYYY-MM-DD/);
    });

    it("rejects impossible calendar dates", () => {
      assert.throws(() => assertIsoDate("2026-02-31"), /Invalid calendar date/);
      assert.throws(() => assertIsoDate("2026-04-31"), /Invalid calendar date/);
      assert.throws(() => assertIsoDate("2026-13-01"), /Invalid calendar date/);
    });
  });

  describe("color length limits", () => {
    it("enforces 50-char limit on item color", () => {
      const now = new Date();
      const longColor = "a".repeat(51);
      const item = createStreakItem({
        id: "test",
        name: "Test",
        color: longColor,
        now
      });
      assert.equal(item.color.length, 50);
    });

    it("enforces 50-char limit on accent color in preferences", () => {
      const longColor = "b".repeat(51);
      const prefs = normalizePreferences({ accentColor: longColor });
      assert.equal(prefs.accentColor.length, 50);
    });
  });

  describe("id length limits", () => {
    it("enforces 128-char limit on item id", () => {
      const now = new Date();
      const longId = "c".repeat(129);
      assert.throws(
        () => createStreakItem({ id: longId, name: "Test", now }),
        /Streak item id must be 128 characters or less/
      );
    });
  });

  describe("storage validation", () => {
    it("rejects impossible calendar dates in import", () => {
      const sample = {
        format: "streakbeacon.export",
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
        app: { name: "StreakBeacon" },
        data: {
          schemaVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: [{
            id: "test",
            name: "Test",
            color: "#000",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: 0,
            archivedAt: null
          }],
          completions: {
            test: {
              "2026-02-31": { completed: true, updatedAt: new Date().toISOString() }
            }
          },
          preferences: {
            theme: "dark",
            weekStartsOn: 0,
            gridWindowDays: 90,
            showArchived: false,
            accentColor: "#000"
          }
        }
      };

      const result = validateImportText(JSON.stringify(sample));
      if (result.ok) {
        assert.fail("Should have failed validation");
      }
      assert.ok(result.errors.some(e => e.includes("Invalid calendar completion date")), `Expected error not found in: ${result.errors.join(", ")}`);
    });
  });
});
