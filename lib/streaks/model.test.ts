import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addStreakItem,
  calculateCurrentStreak,
  calculateLongestStreak,
  createEmptyStreakData,
  deleteStreakItem,
  renameStreakItem,
  setDayCompletion
} from "./model";

describe("streak domain model", () => {
  it("covers create, rename, delete, completion, and streak math", () => {
    const now = new Date("2026-05-27T12:00:00.000Z");
    let data = createEmptyStreakData();

    data = addStreakItem(data, {
      id: "morning-walk",
      name: "  Morning walk  ",
      now
    });

    assert.equal(data.items[0]?.name, "Morning walk");

    data = renameStreakItem(data, {
      id: "morning-walk",
      name: "Daily walk",
      now: new Date("2026-05-27T13:00:00.000Z")
    });

    data = setDayCompletion(
      data,
      "morning-walk",
      "2026-05-24",
      true,
      now
    );
    data = setDayCompletion(
      data,
      "morning-walk",
      "2026-05-25",
      true,
      now
    );
    data = setDayCompletion(
      data,
      "morning-walk",
      "2026-05-26",
      true,
      now
    );
    data = setDayCompletion(
      data,
      "morning-walk",
      "2026-05-27",
      true,
      now
    );
    data = setDayCompletion(
      data,
      "morning-walk",
      "2026-05-25",
      false,
      now
    );

    const item = data.items[0];
    assert.ok(item);
    assert.equal(item.name, "Daily walk");
    assert.deepEqual(item.completedDays, [
      "2026-05-24",
      "2026-05-26",
      "2026-05-27"
    ]);
    assert.equal(calculateCurrentStreak(item, "2026-05-27"), 2);
    assert.equal(calculateLongestStreak(item), 2);

    data = deleteStreakItem(data, "morning-walk");

    assert.deepEqual(data.items, []);
  });

  it("keeps current streak alive when today is not complete yet", () => {
    const data = setDayCompletion(
      addStreakItem(createEmptyStreakData(), {
        id: "ship",
        name: "Ship",
        now: new Date("2026-05-26T12:00:00.000Z")
      }),
      "ship",
      "2026-05-26",
      true,
      new Date("2026-05-26T12:00:00.000Z")
    );

    assert.equal(calculateCurrentStreak(data.items[0], "2026-05-27"), 1);
  });
});
