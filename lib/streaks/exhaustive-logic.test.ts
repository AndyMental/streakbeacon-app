import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  type Completion,
  type IsoDate
} from "./model";

describe("exhaustive streak logic", () => {
  const manual = { completedAt: new Date().toISOString(), source: "manual" as const };

  describe("calculateCurrentStreak", () => {
    it("returns 0 for empty history", () => {
      assert.equal(calculateCurrentStreak({}, "2026-05-31"), 0);
    });

    it("handles year boundaries correctly", () => {
      const completions: Record<IsoDate, Completion> = {
        "2025-12-30": manual,
        "2025-12-31": manual,
        "2026-01-01": manual,
        "2026-01-02": manual
      };
      assert.equal(calculateCurrentStreak(completions, "2026-01-02"), 4);
      assert.equal(calculateCurrentStreak(completions, "2026-01-03"), 4);
    });

    it("handles year boundaries with a gap", () => {
      const completions: Record<IsoDate, Completion> = {
        "2025-12-30": manual,
        // Gap on Dec 31
        "2026-01-01": manual,
        "2026-01-02": manual
      };
      assert.equal(calculateCurrentStreak(completions, "2026-01-02"), 2);
    });

    it("handles leap years correctly (2024 is a leap year)", () => {
      const completions: Record<IsoDate, Completion> = {
        "2024-02-28": manual,
        "2024-02-29": manual,
        "2024-03-01": manual
      };
      assert.equal(calculateCurrentStreak(completions, "2024-03-01"), 3);
    });

    it("handles non-leap years correctly (2023 is not a leap year)", () => {
      const completions: Record<IsoDate, Completion> = {
        "2023-02-27": manual,
        "2023-02-28": manual,
        "2023-03-01": manual
      };
      assert.equal(calculateCurrentStreak(completions, "2023-03-01"), 3);
    });

    it("returns 0 if the streak was broken yesterday and today is not complete", () => {
      const completions: Record<IsoDate, Completion> = {
        "2026-05-29": manual,
        // Gap on May 30
      };
      assert.equal(calculateCurrentStreak(completions, "2026-05-31"), 0);
    });

    it("ignores future completions relative to asOfDay", () => {
      const completions: Record<IsoDate, Completion> = {
        "2026-05-30": manual,
        "2026-05-31": manual,
        "2026-06-01": manual
      };
      assert.equal(calculateCurrentStreak(completions, "2026-05-31"), 2);
    });
  });

  describe("calculateLongestStreak", () => {
    it("returns 0 for empty history", () => {
      assert.equal(calculateLongestStreak({}), 0);
    });

    it("handles year boundaries", () => {
      const completions: Record<IsoDate, Completion> = {
        "2025-12-31": manual,
        "2026-01-01": manual
      };
      assert.equal(calculateLongestStreak(completions), 2);
    });

    it("handles leap years", () => {
      const completions: Record<IsoDate, Completion> = {
        "2024-02-28": manual,
        "2024-02-29": manual,
        "2024-03-01": manual
      };
      assert.equal(calculateLongestStreak(completions), 3);
    });

    it("finds the longest among multiple streaks", () => {
      const completions: Record<IsoDate, Completion> = {
        "2026-05-01": manual,
        "2026-05-02": manual,
        // gap
        "2026-05-10": manual,
        "2026-05-11": manual,
        "2026-05-12": manual,
        // gap
        "2026-05-20": manual
      };
      assert.equal(calculateLongestStreak(completions), 3);
    });

    it("handles unsorted completion keys", () => {
      // The current implementation sorts the keys, but it's good to verify
      const completions: Record<IsoDate, Completion> = {
        "2026-05-02": manual,
        "2026-05-01": manual,
        "2026-05-03": manual
      };
      assert.equal(calculateLongestStreak(completions), 3);
    });

    it("handles multiple streaks of the same length", () => {
      const completions: Record<IsoDate, Completion> = {
        "2026-05-01": manual,
        "2026-05-02": manual,
        // gap
        "2026-05-10": manual,
        "2026-05-11": manual
      };
      assert.equal(calculateLongestStreak(completions), 2);
    });

    it("handles single completion", () => {
      assert.equal(calculateLongestStreak({ "2026-05-01": manual }), 1);
    });
  });

  describe("date boundary behavior", () => {
    it("is consistent with UTC-based ISO strings", () => {
      // StreakBeacon logic uses T00:00:00.000Z to ensure consistency.
      // This test ensures that the helpers work as expected.
      const completions: Record<IsoDate, Completion> = {
        "2026-05-31": manual
      };

      // Current streak as of 2026-06-01 should be 1
      assert.equal(calculateCurrentStreak(completions, "2026-06-01"), 1);

      // But if we are "at" 2026-05-31, it's also 1
      assert.equal(calculateCurrentStreak(completions, "2026-05-31"), 1);

      // If we are "at" 2026-06-02, it's 0 (streak broken)
      assert.equal(calculateCurrentStreak(completions, "2026-06-02"), 0);
    });
  });
});
