import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  addStreakItem,
  createEmptyStreakData,
  setDayCompletion,
} from "@/lib/streaks/model";
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
    setupDom();

    const now = new Date("2026-05-27T12:00:00.000Z");
    let data = createEmptyStreakData(now);
    data = addStreakItem(data, { id: "test-habit", name: "Test Habit", now });
    data = setDayCompletion(data, "test-habit", "2026-05-27", true, now);

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<WeeklyOverview data={data} asOf={now} />);
      await flushEffects();
    });

    assert.equal(document.querySelector("h2")?.textContent, "Weekly overview");
    assert.match(document.body.textContent ?? "", /Test Habit/);

    const gridRows = Array.from(document.querySelectorAll(".grid")).filter(
      (element) =>
        element.classList.contains(
          "grid-cols-[minmax(8rem,1fr)_repeat(7,2.5rem)]"
        )
    );
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

  it("returns null when there are no active habits", async () => {
    setupDom();

    const now = new Date("2026-05-27T12:00:00.000Z");
    const data = createEmptyStreakData(now);

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<WeeklyOverview data={data} asOf={now} />);
      await flushEffects();
    });

    assert.equal(document.body.innerHTML, "<div></div>");
  });
});

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
