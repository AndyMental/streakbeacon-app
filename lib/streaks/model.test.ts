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
      showArchived: true,
      accentColor: " #2D9CDB "
    });

    assert.equal(data.preferences.theme, "dark");
    assert.equal(data.preferences.weekStartsOn, 1);
    assert.equal(data.preferences.gridWindowDays, 180);
    assert.equal(data.preferences.showArchived, true);
    assert.equal(data.preferences.accentColor, "#2D9CDB");
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

  it("rejects duplicate items and completion updates for unknown streaks", () => {
    const now = new Date("2026-05-27T12:00:00.000Z");
    const data = addStreakItem(createEmptyStreakData(now), {
      id: "read",
      name: "Read",
      now
    });

    assert.throws(
      () =>
        addStreakItem(data, {
          id: "read",
          name: "Read again",
          now
        }),
      /Streak item already exists: read/
    );
    assert.throws(
      () => setDayCompletion(data, "missing", "2026-05-27", true, now),
      /Streak item not found: missing/
    );
  });

  it("normalizes optional item fields without overwriting omitted values", () => {
    const now = new Date("2026-05-27T12:00:00.000Z");
    const data = addStreakItem(createEmptyStreakData(now), {
      id: "journal",
      name: "Journal",
      description: "  Capture notes  ",
      color: " #2D9CDB ",
      now
    });

    const renamed = renameStreakItem(data, {
      id: "journal",
      name: "Daily journal",
      now: new Date("2026-05-27T13:00:00.000Z")
    });

    assert.equal(renamed.items[0]?.description, "Capture notes");
    assert.equal(renamed.items[0]?.color, "#2D9CDB");

    const updated = renameStreakItem(renamed, {
      id: "journal",
      name: "Daily journal",
      description: "  ",
      color: "  ",
      now: new Date("2026-05-27T14:00:00.000Z")
    });

    assert.equal(updated.items[0]?.description, "");
    assert.equal(updated.items[0]?.color, "#27AE60");
  });

  it("creates the documented versioned export envelope", () => {
    const exportedAt = new Date("2026-05-27T12:00:00.000Z");
    const data = createEmptyStreakData(exportedAt);

    assert.deepEqual(createExportEnvelope(data, exportedAt), {
      format: "streakbeacon.export",
      formatVersion: 1,
      exportedAt: "2026-05-27T12:00:00.000Z",
      app: {
        name: "StreakBeacon"
      },
      data
    });
  });
});
