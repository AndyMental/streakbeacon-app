import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { StreakDashboard } from "./streak-dashboard";
import { TooltipProvider } from "@/components/ui/tooltip";

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

  globalThis.PointerEvent = class PointerEvent extends window.MouseEvent {
    constructor(type: string, props: MouseEventInit = {}) {
      super(type, props);
    }
  } as unknown as typeof PointerEvent;
}

function flushEffects() {
  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
}

describe("StreakDashboard Search UI", () => {
  afterEach(() => {
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

  it("renders the search input when habits are present", async () => {
    setupDom();

    // Seed initial data with multiple habits
    const now = new Date("2026-05-27T12:00:00.000Z");
    const initialData = {
      schemaVersion: 2,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      items: [
        {
          id: "habit-1",
          name: "Exercise",
          description: "Daily workout",
          color: "#27AE60",
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          order: 0,
          archivedAt: null,
        },
      ],
      completions: { "habit-1": {} },
      preferences: {
        theme: "system",
        weekStartsOn: 0,
        gridWindowDays: 365,
        showArchived: false,
        accentColor: "#27AE60",
      },
    };
    window.localStorage.setItem(
      "streakbeacon:data:v1",
      JSON.stringify(initialData)
    );

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

    // Check search input is present
    const searchInput = document.querySelector(
      '[data-testid="streak-search-input"]'
    );
    assert.ok(searchInput, "Search input should be rendered when habits are present");
  });
});
