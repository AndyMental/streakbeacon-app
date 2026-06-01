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
    url: "https://streakbeacon.test"
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
    value: window.navigator
  });
  globalThis.localStorage = window.localStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  (window as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false
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

async function clickElement(element: Element) {
  await act(async () => {
    element.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    await flushEffects();
  });
}

describe("StreakDashboard Seed Examples", () => {
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

  it("renders the seed button when storage is empty and populates data on click", async () => {
    setupDom();

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

    const seedButton = document.querySelector<HTMLButtonElement>(
      '[data-testid="dashboard-seed-examples"]'
    );
    assert.ok(seedButton, "Seed button should be visible in empty state");

    await clickElement(seedButton);

    const streakItems = document.querySelectorAll('[data-testid^="streak-item-"]');
    assert.ok(streakItems.length >= 3, `Should have at least 3 streak items, found ${streakItems.length}`);
    
    const meditationItem = Array.from(streakItems).find(el => el.textContent?.includes("Meditation"));
    assert.ok(meditationItem, "Should have a Meditation habit");
  });
});
