import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  addStreakItem,
  createEmptyStreakData,
  setDayCompletion,
  type IsoDate,
  type StreakData,
} from "@/lib/streaks/model";
import { buildStreakGridModel } from "@/lib/streaks/grid";
import { WeeklyOverview } from "@/components/weekly-overview";

let root: Root | null = null;
let dom: JSDOM | null = null;

describe("WeeklyOverview", () => {
  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    root = null;
    dom?.window.close();
    dom = null;
  });

  it("renders the last seven days for active habits", async () => {
    const now = new Date("2026-05-27T12:00:00.000Z");
    const data = buildWeeklyData(now, [
      {
        id: "test-habit",
        name: "Test Habit",
        completedDays: ["2026-05-27"],
      },
    ]);

    await renderWeeklyOverview(data, now);

    assert.equal(document.querySelector("h2")?.textContent, "Weekly overview");
    assert.match(document.body.textContent ?? "", /Test Habit/);

    const gridRows = getWeeklyGridRows();
    assert.equal(
      gridRows.length,
      2,
      "header and habit row should both use the seven-day grid"
    );

    assert.ok(
      document.querySelector(
        '[aria-label="Test Habit on Wednesday, May 27: Completed"]'
      ),
      "completed day should be announced"
    );
    assert.ok(
      document.querySelector(
        '[aria-label="Test Habit on Tuesday, May 26: Open"]'
      ),
      "open day should be announced"
    );
  });

  for (const completedDayCount of [0, 1, 2, 3, 4, 5, 6, 7]) {
    it(`announces ${completedDayCount} completed days in the weekly window`, async () => {
      const now = new Date("2026-05-27T12:00:00.000Z");
      const completedDays = weeklyWindowDays.slice(0, completedDayCount);
      const data = buildWeeklyData(now, [
        {
          id: "reading",
          name: "Reading",
          completedDays,
        },
      ]);

      await renderWeeklyOverview(data, now);

      assert.equal(countDayStates("Reading", "Completed"), completedDayCount);
      assert.equal(countDayStates("Reading", "Open"), 7 - completedDayCount);
    });
  }

  it("keeps weekly completion state independent across multiple habits", async () => {
    const now = new Date("2026-05-27T12:00:00.000Z");
    const data = buildWeeklyData(now, [
      {
        id: "reading",
        name: "Reading",
        completedDays: ["2026-05-21", "2026-05-23", "2026-05-27"],
      },
      {
        id: "running",
        name: "Running",
        completedDays: ["2026-05-22", "2026-05-24", "2026-05-26"],
      },
      {
        id: "journaling",
        name: "Journaling",
        completedDays: [],
      },
    ]);

    await renderWeeklyOverview(data, now);

    assert.equal(getWeeklyGridRows().length, 4);
    assert.equal(countDayStates("Reading", "Completed"), 3);
    assert.equal(countDayStates("Reading", "Open"), 4);
    assert.equal(countDayStates("Running", "Completed"), 3);
    assert.equal(countDayStates("Running", "Open"), 4);
    assert.equal(countDayStates("Journaling", "Completed"), 0);
    assert.equal(countDayStates("Journaling", "Open"), 7);
    assert.ok(
      document.querySelector(
        '[aria-label="Reading on Thursday, May 21: Completed"]'
      )
    );
    assert.ok(
      document.querySelector('[aria-label="Running on Thursday, May 21: Open"]')
    );
  });

  it("updates announced day state when completion changes", async () => {
    const now = new Date("2026-05-27T12:00:00.000Z");
    let data = buildWeeklyData(now, [
      { id: "reading", name: "Reading", completedDays: [] },
    ]);

    await renderWeeklyOverview(data, now);

    assert.ok(
      document.querySelector(
        '[aria-label="Reading on Wednesday, May 27: Open"]'
      )
    );

    data = setDayCompletion(data, "reading", "2026-05-27", true, now);
    await renderWeeklyOverview(data, now);

    assert.ok(
      document.querySelector(
        '[aria-label="Reading on Wednesday, May 27: Completed"]'
      )
    );
    assert.equal(
      document.querySelector(
        '[aria-label="Reading on Wednesday, May 27: Open"]'
      ),
      null
    );

    data = setDayCompletion(data, "reading", "2026-05-27", false, now);
    await renderWeeklyOverview(data, now);

    assert.ok(
      document.querySelector(
        '[aria-label="Reading on Wednesday, May 27: Open"]'
      )
    );
    assert.equal(countDayStates("Reading", "Completed"), 0);
  });

  it("marks the selected overview day from the grid model", async () => {
    const now = new Date("2026-05-27T12:00:00.000Z");
    let data = createEmptyStreakData(now);
    data = addStreakItem(data, { id: "test-habit", name: "Test Habit", now });
    data = setDayCompletion(data, "test-habit", "2026-05-24", true, now);

    await renderWeeklyOverview(data, now, "2026-05-24");

    assert.ok(
      document.querySelector(
        '[aria-label="Test Habit on Sunday, May 24: Completed"][aria-current="date"]'
      ),
      "selected non-today completion should be marked as the current date"
    );
    assert.equal(
      document.querySelectorAll('[aria-current="date"]').length,
      2,
      "the selected day should be marked in the header and habit row"
    );
  });

  it("returns null when there are no active habits", async () => {
    const now = new Date("2026-05-27T12:00:00.000Z");
    const data = createEmptyStreakData(now);

    await renderWeeklyOverview(data, now);

    assert.equal(document.body.innerHTML, "<div></div>");
  });
});

const weeklyWindowDays: IsoDate[] = [
  "2026-05-21",
  "2026-05-22",
  "2026-05-23",
  "2026-05-24",
  "2026-05-25",
  "2026-05-26",
  "2026-05-27",
];

function buildWeeklyData(
  now: Date,
  habits: Array<{
    id: string;
    name: string;
    completedDays: IsoDate[];
  }>
): StreakData {
  return habits.reduce((data, habit) => {
    const withHabit = addStreakItem(data, {
      id: habit.id,
      name: habit.name,
      now,
    });

    return habit.completedDays.reduce(
      (nextData, day) => setDayCompletion(nextData, habit.id, day, true, now),
      withHabit
    );
  }, createEmptyStreakData(now));
}

async function renderWeeklyOverview(
  data: StreakData,
  asOf: Date,
  selectedDay: IsoDate | null = null
) {
  if (!dom) {
    setupDom();
  }

  if (!root) {
    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  }

  const selectedItemId =
    data.items.find((item) => !item.archivedAt)?.id ?? null;
  const model = buildStreakGridModel(data, selectedItemId, selectedDay, asOf);

  await act(async () => {
    root?.render(
      <WeeklyOverview data={data} overview={model.weeklyOverview} />
    );
    await flushEffects();
  });
}

function getWeeklyGridRows() {
  return Array.from(document.querySelectorAll(".grid")).filter((element) =>
    element.classList.contains("grid-cols-[minmax(8rem,1fr)_repeat(7,2.5rem)]")
  );
}

function countDayStates(habitName: string, state: "Completed" | "Open") {
  return (
    document.querySelectorAll(`[aria-label^="${habitName} on "]`).length -
    document.querySelectorAll(
      `[aria-label^="${habitName} on "]:not([aria-label$=": ${state}"])`
    ).length
  );
}

function setupDom() {
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://streakbeacon.test",
  });

  const { window } = dom;

  globalThis.window = window as unknown as Window & typeof globalThis;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: window.navigator,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  (
    window as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;

  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

function flushEffects() {
  return new Promise((resolve) => {
    queueMicrotask(resolve);
  });
}
