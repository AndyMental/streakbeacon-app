import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hydrateTodayHabits,
  hydrateSignals,
  formatIsoDay
} from "./dashboard-hydration";
import {
  addStreakItem,
  createEmptyStreakData,
  setDayCompletion,
  updatePreferences
} from "./model";

describe("dashboard hydration logic", () => {
  const now = new Date("2026-05-31T12:00:00.000Z");

  it("handles empty state (no habits)", () => {
    const data = createEmptyStreakData(now);
    const habits = hydrateTodayHabits(data, now);
    const signals = hydrateSignals(data);

    assert.deepEqual(habits, []);
    assert.equal(signals.find((s) => s.label === "Grid window")?.value, "365");
  });

  it("derives partial and full completions for the today card", () => {
    let data = createEmptyStreakData(now);
    data = addStreakItem(data, { id: "h1", name: "Habit 1", now });
    data = addStreakItem(data, { id: "h2", name: "Habit 2", now });

    // Habit 1 is done today
    data = setDayCompletion(data, "h1", "2026-05-31", true, now);
    // Habit 2 is not done today, but has a streak from yesterday
    data = setDayCompletion(data, "h2", "2026-05-30", true, now);

    const habits = hydrateTodayHabits(data, now);

    assert.equal(habits.length, 2);

    assert.equal(habits[0].name, "Habit 1");
    assert.equal(habits[0].streak, "1 day");
    assert.equal(habits[0].status, "Done today");

    assert.equal(habits[1].name, "Habit 2");
    assert.equal(habits[1].streak, "1 day");
    assert.equal(habits[1].status, "Queued");
  });

  it("calculates multi-day streaks correctly", () => {
    let data = createEmptyStreakData(now);
    data = addStreakItem(data, { id: "h1", name: "Habit 1", now });

    // 3 day streak including today
    data = setDayCompletion(data, "h1", "2026-05-29", true, now);
    data = setDayCompletion(data, "h1", "2026-05-30", true, now);
    data = setDayCompletion(data, "h1", "2026-05-31", true, now);

    const habits = hydrateTodayHabits(data, now);
    assert.equal(habits[0].streak, "3 days");
    assert.equal(habits[0].status, "Done today");
  });

  it("keeps streak alive if not done today yet", () => {
    let data = createEmptyStreakData(now);
    data = addStreakItem(data, { id: "h1", name: "Habit 1", now });

    // Done yesterday, but not today yet
    data = setDayCompletion(data, "h1", "2026-05-30", true, now);

    const habits = hydrateTodayHabits(data, now);
    assert.equal(habits[0].streak, "1 day");
    assert.equal(habits[0].status, "Queued");
  });

  it("reports 0 day streak if missed yesterday and today", () => {
    let data = createEmptyStreakData(now);
    data = addStreakItem(data, { id: "h1", name: "Habit 1", now });

    // Done 2 days ago, but missed yesterday and today
    data = setDayCompletion(data, "h1", "2026-05-29", true, now);

    const habits = hydrateTodayHabits(data, now);
    assert.equal(habits[0].streak, "0 days");
    assert.equal(habits[0].status, "Queued");
  });

  it("reflects grid window and schema version in signals", () => {
    let data = createEmptyStreakData(now);
    data = updatePreferences(data, { gridWindowDays: 90 });

    const signals = hydrateSignals(data);

    const version = signals.find((s) => s.label === "Export format");
    const storage = signals.find((s) => s.label === "Storage");
    const window = signals.find((s) => s.label === "Grid window");

    assert.equal(version?.value, "v1");
    assert.equal(storage?.value, "Local");
    assert.equal(window?.value, "90");
  });

  it("utility formatIsoDay works", () => {
    assert.equal(formatIsoDay(new Date("2026-01-01T00:00:00Z")), "2026-01-01");
    assert.equal(formatIsoDay(new Date("2026-12-31T23:59:59Z")), "2026-12-31");
  });
});
