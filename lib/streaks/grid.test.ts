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
  it("renders an empty data view with stable weeks and zero summaries", () => {
    const model = buildStreakGridModel(createEmptyStreakData(AS_OF), null, null, AS_OF);

    assert.equal(model.activeItem, null);
    assert.equal(model.currentStreak, 0);
    assert.equal(model.longestStreak, 0);
    assert.equal(model.completedDays, 0);
    assert.equal(model.totalDays, 365);
    assert.equal(model.weeks.length, 53);
    assert.equal(model.weeks.flatMap((week) => week.days).length, 365);
    assert.equal(
      model.weeks.slice(0, -1).every((week) => week.days.length === 7),
      true
    );
    assert.equal(getNextSelectedCompletion(model), null);
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

  it("renders dense data with distinguishable intensity levels", () => {
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
    assert.deepEqual(
      [...new Set(completed.map((day) => day.intensity))].sort(),
      [1, 2, 3, 4]
    );
    assert.equal(getNextSelectedCompletion(model), false);
  });
});

function isoOffset(offset: number) {
  const next = new Date(AS_OF);
  next.setUTCDate(next.getUTCDate() - offset);
  return next.toISOString().slice(0, 10) as `${number}-${number}-${number}`;
}
