import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addStreakItem,
  calculateCurrentStreak,
  calculateLongestStreak,
  createEmptyStreakData,
  createExportEnvelope,
  deleteStreakItem,
  renameStreakItem,
  setDayCompletion,
  updatePreferences
} from "./model";

describe("streak domain model", () => {
  it("covers create, rename, delete, completion, and streak math", () => {
    const now = new Date("2026-05-27T12:00:00.000Z");
    let data = createEmptyStreakData(now);

    data = addStreakItem(data, {
      id: "morning-walk",
      name: "  Morning walk  ",
      now
    });

    assert.equal(data.items[0]?.name, "Morning walk");
    assert.deepEqual(data.completions["morning-walk"], {});

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
    assert.deepEqual(Object.keys(data.completions[item.id]), [
      "2026-05-24",
      "2026-05-26",
      "2026-05-27"
    ]);
    assert.equal(calculateCurrentStreak(data.completions[item.id], "2026-05-27"), 2);
    assert.equal(calculateLongestStreak(data.completions[item.id]), 2);

    data = deleteStreakItem(data, "morning-walk", now);

    assert.deepEqual(data.items, []);
    assert.equal(data.completions["morning-walk"], undefined);
  });

  it("keeps current streak alive when today is not complete yet", () => {
    const now = new Date("2026-05-26T12:00:00.000Z");
    const data = setDayCompletion(
      addStreakItem(createEmptyStreakData(now), {
        id: "ship",
        name: "Ship",
        now
      }),
      "ship",
      "2026-05-26",
      true,
      now
    );

    assert.equal(calculateCurrentStreak(data.completions.ship, "2026-05-27"), 1);
  });

  it("persists theme and display preferences in the data model", () => {
    const data = updatePreferences(createEmptyStreakData(), {
      theme: "dark",
      weekStartsOn: 1,
      gridWindowDays: 180,
      showArchived: true
    });

    assert.equal(data.preferences.theme, "dark");
    assert.equal(data.preferences.weekStartsOn, 1);
    assert.equal(data.preferences.gridWindowDays, 180);
    assert.equal(data.preferences.showArchived, true);
  });

  it("defaults and clamps the grid window preference to the product range", () => {
    assert.equal(createEmptyStreakData().preferences.gridWindowDays, 365);

    assert.equal(
      updatePreferences(createEmptyStreakData(), {
        gridWindowDays: 1
      }).preferences.gridWindowDays,
      7
    );
    assert.equal(
      updatePreferences(createEmptyStreakData(), {
        gridWindowDays: 999
      }).preferences.gridWindowDays,
      365
    );
  });

  it("creates the documented versioned export envelope", () => {
    const exportedAt = new Date("2026-05-27T12:00:00.000Z");
    const data = createEmptyStreakData(exportedAt);

    assert.deepEqual(createExportEnvelope(data, exportedAt), {
      format: "streakbeacon.export",
      formatVersion: 2,
      exportedAt: "2026-05-27T12:00:00.000Z",
      app: {
        name: "StreakBeacon"
      },
      data
    });
  });
});
