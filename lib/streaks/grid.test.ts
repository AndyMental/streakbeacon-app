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

  it("renders dense data with binary intensity levels for single habits", () => {
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
      [1]
    );
    assert.equal(getNextSelectedCompletion(model), false);
  });

  it("renders cumulative intensity based on the number of active habits", () => {
    let data = createEmptyStreakData(AS_OF);
    data = addStreakItem(data, { id: "h1", name: "H1", now: AS_OF });
    data = addStreakItem(data, { id: "h2", name: "H2", now: AS_OF });
    data = addStreakItem(data, { id: "h3", name: "H3", now: AS_OF });
    data = addStreakItem(data, { id: "h4", name: "H4", now: AS_OF });
    data = addStreakItem(data, { id: "h5", name: "H5", now: AS_OF });

    // Day with 1 completion -> intensity 1
    data = setDayCompletion(data, "h1", "2026-05-20", true, AS_OF);

    // Day with 3 completions -> intensity 3
    data = setDayCompletion(data, "h1", "2026-05-21", true, AS_OF);
    data = setDayCompletion(data, "h2", "2026-05-21", true, AS_OF);
    data = setDayCompletion(data, "h3", "2026-05-21", true, AS_OF);

    // Day with 5 completions -> intensity 4 (capped)
    data = setDayCompletion(data, "h1", "2026-05-22", true, AS_OF);
    data = setDayCompletion(data, "h2", "2026-05-22", true, AS_OF);
    data = setDayCompletion(data, "h3", "2026-05-22", true, AS_OF);
    data = setDayCompletion(data, "h4", "2026-05-22", true, AS_OF);
    data = setDayCompletion(data, "h5", "2026-05-22", true, AS_OF);

    const model = buildStreakGridModel(data, null, null, AS_OF);
    const days = model.weeks.flatMap((w) => w.days);

    const d20 = days.find((d) => d.day === "2026-05-20");
    const d21 = days.find((d) => d.day === "2026-05-21");
    const d22 = days.find((d) => d.day === "2026-05-22");
    const d23 = days.find((d) => d.day === "2026-05-23");

    assert.equal(d20?.intensity, 1);
    assert.equal(d20?.isComplete, false); // only 1/5 done

    assert.equal(d21?.intensity, 3);
    assert.equal(d21?.isComplete, false); // only 3/5 done

    assert.equal(d22?.intensity, 4);
    assert.equal(d22?.isComplete, true); // 5/5 done

    assert.equal(d23?.intensity, 0);
  });
});

function isoOffset(offset: number) {
  const next = new Date(AS_OF);
  next.setUTCDate(next.getUTCDate() - offset);
  return next.toISOString().slice(0, 10) as `${number}-${number}-${number}`;
}
