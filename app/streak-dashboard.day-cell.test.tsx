import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StreakDashboard } from "./streak-dashboard";

let root: Root | null = null;
let dom: JSDOM | null = null;

function setupDom() {
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://streakbeacon.test",
  });

  const { window } = dom;

  globalThis.window = window as unknown as Window & typeof globalThis;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  globalThis.Event = window.Event;
  globalThis.CustomEvent = window.CustomEvent;
  globalThis.MouseEvent = window.MouseEvent;
  globalThis.Blob = window.Blob;
  globalThis.URL = window.URL as unknown as typeof globalThis.URL;

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: window.navigator,
  });
  globalThis.localStorage = window.localStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  (
    window as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;

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

  window.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);

  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

function flushEffects() {
  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
}

function seedHabitData() {
  const now = new Date("2026-05-27T12:00:00.000Z");
  window.localStorage.setItem(
    "streakbeacon:data:v1",
    JSON.stringify({
      schemaVersion: 2,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      items: [
        {
          id: "habit-1",
          name: "Read",
          color: "#27AE60",
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          order: 0,
          archivedAt: null,
        },
      ],
      completions: {
        "habit-1": {
          "2026-05-26": {
            completedAt: now.toISOString(),
            source: "manual",
          },
        },
      },
      preferences: {
        theme: "system",
        weekStartsOn: 0,
        gridWindowDays: 365,
        showArchived: false,
        accentColor: "#27AE60",
      },
    })
  );
}

async function renderDashboard() {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(
      <TooltipProvider>
        <StreakDashboard />
      </TooltipProvider>
    );
    await flushEffects();
  });
}

describe("StreakDashboard day-cell controls", () => {
  beforeEach(() => {
    mock.timers.enable({
      apis: ["Date"],
      now: new Date("2026-05-27T12:00:00.000Z"),
    });
  });

  afterEach(() => {
    mock.timers.reset();
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    root = null;
    if (dom) {
      dom.window.close();
    }
    dom = null;
    if (globalThis.localStorage) {
      globalThis.localStorage.clear();
    }
  });

  it("renders day cells as accessible button controls with focus state", async () => {
    setupDom();
    seedHabitData();
    await renderDashboard();

    const completedCell = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Tue, May 26: completed"]'
    );
    const selectedToday = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Wed, May 27: not completed"]'
    );

    assert.ok(completedCell, "completed day cell should be a button");
    assert.equal(completedCell.getAttribute("aria-pressed"), "true");
    assert.ok(
      completedCell.classList.contains("focus-visible:ring-2"),
      "day cell should expose a visible keyboard focus ring"
    );
    assert.equal(selectedToday?.getAttribute("aria-current"), "true");
  });

  it("selects a day cell without losing the day status semantics", async () => {
    setupDom();
    seedHabitData();
    await renderDashboard();

    const openCell = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Mon, May 25: not completed"]'
    );

    assert.ok(openCell, "open day cell should be available");

    await act(async () => {
      openCell.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await flushEffects();
    });

    assert.equal(openCell.getAttribute("aria-current"), "true");
    assert.equal(openCell.getAttribute("aria-pressed"), "false");
    assert.match(document.body.textContent ?? "", /Mon, May 25/);
  });

  it("keeps the tooltip trigger and content coupled to the day-cell button", () => {
    const source = readFileSync("app/streak-dashboard.tsx", "utf8");

    assert.match(source, /<TooltipTrigger asChild>[\s\S]*type="button"/);
    assert.match(
      source,
      /<TooltipContent>\s*{day\.label} - {day\.isComplete \? "Complete" : "Open"}/
    );
  });
});
