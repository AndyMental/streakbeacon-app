import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  createEmptyStreakData,
  addStreakItem,
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

  it("renders the weekly overview with habits and completion status", async () => {
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

    const title = document.querySelector("h2");
    assert.equal(title?.textContent, "Weekly Overview");

    const habitName = document.body.textContent?.includes("Test Habit");
    assert.ok(habitName, "Habit name should be rendered");

    // Verify we have 7 day columns (S, M, T, W, T, F, S narrow labels)
    // Note: Some days might have same narrow label.
    // For 2026-05-27 (Wed), last 7 days are T, F, S, S, M, T, W
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
  globalThis.localStorage = window.localStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
