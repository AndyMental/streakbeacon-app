import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addStreakItem,
  createEmptyStreakData,
  setDayCompletion
} from "./model";
import {
  buildStreakGridModel,
  getNextSelectedCompletion
} from "./grid";

const AS_OF = new Date("2026-05-27T12:00:00.000Z");

describe("streak grid model", () => {
  it("defaults to cumulative view when selectedItemId is null", () => {
    let data = createEmptyStreakData(AS_OF);
    data = addStreakItem(data, { id: "a", name: "A", now: AS_OF });
    data = setDayCompletion(data, "a", isoOffset(0), true, AS_OF);

    const model = buildStreakGridModel(data, null, null, AS_OF);

    assert.equal(model.activeItem, null);
    assert.equal(model.completedDays, 1);
    assert.equal(model.currentStreak, 1);
  });

  it("honors the 365-day preference when building visible summaries", () => {
    const data = addStreakItem(createEmptyStreakData(AS_OF), {
      id: "walk",
      name: "Morning walk",
      now: AS_OF
    });
    const model = buildStreakGridModel(data, "walk", "2026-05-27", AS_OF);
    const visibleDays = model.weeks.flatMap((week) => week.days);

    assert.equal(model.totalDays, 365);
    assert.equal(visibleDays.at(0)?.day, "2025-05-28");
    assert.equal(visibleDays.at(-1)?.day, "2026-05-27");
    assert.equal(model.completionRate, 0);
  });

  it("renders sparse data with selected-day state and next toggle value", () => {
    let data = addStreakItem(createEmptyStreakData(AS_OF), {
      id: "walk",
      name: "Morning walk",
      now: AS_OF
    });

    data = setDayCompletion(data, "walk", "2026-05-25", true, AS_OF);
    data = setDayCompletion(data, "walk", "2026-05-27", true, AS_OF);

    const model = buildStreakGridModel(data, "walk", "2026-05-26", AS_OF);

    assert.equal(model.activeItem?.name, "Morning walk");
    assert.equal(model.completedDays, 2);
    assert.equal(model.currentStreak, 1);
    assert.equal(model.longestStreak, 1);
    assert.equal(model.selectedDay.day, "2026-05-26");
    assert.equal(model.selectedDay.isComplete, false);
    assert.equal(getNextSelectedCompletion(model), true);
  });

  it("renders dense data with binary intensity for single habits", () => {
    let data = addStreakItem(createEmptyStreakData(AS_OF), {
      id: "ship",
      name: "Ship",
      now: AS_OF
    });

    for (let offset = 0; offset < 28; offset += 1) {
      data = setDayCompletion(
        data,
        "ship",
        isoOffset(offset),
        true,
        AS_OF
      );
    }

    const model = buildStreakGridModel(data, "ship", "2026-05-27", AS_OF);
    const completed = model.weeks.flatMap((week) =>
      week.days.filter((day) => day.isComplete)
    );

    assert.equal(model.currentStreak, 28);
    assert.equal(model.longestStreak, 28);
    assert.equal(model.completedDays, 28);
    // Single habit should only have intensity 1 for all completed days
    assert.deepEqual(
      [...new Set(completed.map((day) => day.intensity))].sort(),
      [1]
    );
    assert.equal(getNextSelectedCompletion(model), false);
  });

  it("renders cumulative view aggregating across multiple habits", () => {
    let data = createEmptyStreakData(AS_OF);
    data = addStreakItem(data, { id: "a", name: "A", now: AS_OF });
    data = addStreakItem(data, { id: "b", name: "B", now: AS_OF });
    data = addStreakItem(data, { id: "c", name: "C", now: AS_OF });
    data = addStreakItem(data, { id: "d", name: "D", now: AS_OF });

    // Day 1: 1 completion (25%) -> intensity 1
    data = setDayCompletion(data, "a", isoOffset(0), true, AS_OF);
    // Day 2: 2 completions (50%) -> intensity 2
    data = setDayCompletion(data, "a", isoOffset(1), true, AS_OF);
    data = setDayCompletion(data, "b", isoOffset(1), true, AS_OF);
    // Day 3: 3 completions (75%) -> intensity 3
    data = setDayCompletion(data, "a", isoOffset(2), true, AS_OF);
    data = setDayCompletion(data, "b", isoOffset(2), true, AS_OF);
    data = setDayCompletion(data, "c", isoOffset(2), true, AS_OF);
    // Day 4: 4 completions (100%) -> intensity 4
    data = setDayCompletion(data, "a", isoOffset(3), true, AS_OF);
    data = setDayCompletion(data, "b", isoOffset(3), true, AS_OF);
    data = setDayCompletion(data, "c", isoOffset(3), true, AS_OF);
    data = setDayCompletion(data, "d", isoOffset(3), true, AS_OF);

    const model = buildStreakGridModel(data, null, "2026-05-27", AS_OF);
    
    assert.equal(model.activeItem, null);
    assert.equal(model.completedDays, 4);
    assert.equal(model.currentStreak, 4);
    
    const visibleDays = model.weeks.flatMap(w => w.days);
    const day1 = visibleDays.find(d => d.day === isoOffset(0));
    const day2 = visibleDays.find(d => d.day === isoOffset(1));
    const day3 = visibleDays.find(d => d.day === isoOffset(2));
    const day4 = visibleDays.find(d => d.day === isoOffset(3));

    assert.equal(day1?.intensity, 1);
    assert.equal(day2?.intensity, 2);
    assert.equal(day3?.intensity, 3);
    assert.equal(day4?.intensity, 4);
    assert.equal(getNextSelectedCompletion(model), null);
  });

  it("aggregates metrics across all active habits in 'All Habits' view", () => {
    let data = createEmptyStreakData(AS_OF);
    data = addStreakItem(data, { id: "habit-1", name: "Habit 1", now: AS_OF });
    data = addStreakItem(data, { id: "habit-2", name: "Habit 2", now: AS_OF });

    // habit-1 completed on 2026-05-25 and 2026-05-26
    data = setDayCompletion(data, "habit-1", "2026-05-25", true, AS_OF);
    data = setDayCompletion(data, "habit-1", "2026-05-26", true, AS_OF);

    // habit-2 completed on 2026-05-26 and 2026-05-27
    data = setDayCompletion(data, "habit-2", "2026-05-26", true, AS_OF);
    data = setDayCompletion(data, "habit-2", "2026-05-27", true, AS_OF);

    // selectedItemId = null means "All Habits"
    const model = buildStreakGridModel(data, null, "2026-05-27", AS_OF);

    assert.equal(model.activeItem, null);
    // Unique days: 25, 26, 27
    assert.equal(model.completedDays, 3);
    // Current streak: 27, 26, 25 are all complete -> 3
    assert.equal(model.currentStreak, 3);
    assert.equal(model.longestStreak, 3);

    const visibleDays = model.weeks.flatMap((week) => week.days);
    const d25 = visibleDays.find((d) => d.day === "2026-05-25");
    const d26 = visibleDays.find((d) => d.day === "2026-05-26");
    const d27 = visibleDays.find((d) => d.day === "2026-05-27");

    assert.equal(d25?.isComplete, true);
    assert.equal(d26?.isComplete, true);
    assert.equal(d27?.isComplete, true);
  });
});

function isoOffset(offset: number) {
  const next = new Date(AS_OF);
  next.setUTCDate(next.getUTCDate() - offset);
  return next.toISOString().slice(0, 10) as `${number}-${number}-${number}`;
}
