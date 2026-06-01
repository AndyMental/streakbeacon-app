import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { StreakDashboard } from "./streak-dashboard";
import { SettingsPanel } from "./settings-panel";
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
}

function flushEffects() {
  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
}

describe("Mobile Responsive Layout Polish", () => {
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

  it("StreakDashboard should have responsive touch targets and layout classes", async () => {
    setupDom();

    // Seed initial data
    const now = new Date("2026-05-27T12:00:00.000Z");
    const initialData = {
      schemaVersion: 2,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      items: [
        { id: "habit-1", name: "Initial Habit", color: "#27AE60", createdAt: now.toISOString(), updatedAt: now.toISOString(), order: 0, archivedAt: null }
      ],
      completions: { "habit-1": {} },
      preferences: { theme: "system", weekStartsOn: 0, gridWindowDays: 365, showArchived: false, accentColor: "#27AE60" }
    };
    window.localStorage.setItem("streakbeacon:data:v1", JSON.stringify(initialData));

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
    
    // Switch to the specific habit so rename/delete buttons render
    const habitBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Initial Habit"));
    if (habitBtn) {
      await act(async () => {
        habitBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await flushEffects();
      });
    }

    // Check streak grid cell sizes
    const gridCells = document.querySelectorAll('button[aria-label^="May"]');
    if (gridCells.length > 0) {
      const firstCell = gridCells[0];
      assert.ok(firstCell.classList.contains("h-11"), "Grid cell should have h-11 on mobile");
      assert.ok(firstCell.classList.contains("w-11"), "Grid cell should have w-11 on mobile");
      assert.ok(firstCell.classList.contains("sm:h-5"), "Grid cell should have sm:h-5 on desktop");
    }

    // Check grid container auto-cols
    const gridContainer = document.querySelector(".grid.w-max");
    assert.ok(gridContainer?.classList.contains("auto-cols-[2.75rem]"), "Grid container should have auto-cols-[2.75rem] for mobile touch targets");
    assert.ok(gridContainer?.classList.contains("sm:auto-cols-[1.35rem]"), "Grid container should have sm:auto-cols-[1.35rem] for desktop");

    // Check action buttons container flex-wrap
    const actionsContainer = document.querySelector(".flex.flex-wrap.items-center.gap-2");
    assert.ok(actionsContainer, "Actions container should have flex-wrap");

    // Check action buttons size
    const renameButton = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Rename"));
    assert.ok(renameButton?.classList.contains("min-h-11"), "Rename button should have min-h-11 (size=lg) on mobile");
    assert.ok(renameButton?.classList.contains("sm:min-h-9"), "Rename button should have sm:min-h-9 on desktop");
  });

  it("SettingsPanel should have responsive touch targets for restore buttons", async () => {
    setupDom();

    // Seed data with archived item
    const now = new Date("2026-05-27T12:00:00.000Z");
    const archivedData = {
      schemaVersion: 2,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      items: [
        { id: "archived-1", name: "Archived Habit", color: "#27AE60", createdAt: now.toISOString(), updatedAt: now.toISOString(), order: 0, archivedAt: now.toISOString() }
      ],
      completions: { "archived-1": {} },
      preferences: { theme: "system", weekStartsOn: 0, gridWindowDays: 365, showArchived: false, accentColor: "#27AE60" }
    };
    window.localStorage.setItem("streakbeacon:data:v1", JSON.stringify(archivedData));

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<SettingsPanel />);
      await flushEffects();
    });

    const restoreButton = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Restore"));
    assert.ok(restoreButton, "Restore button should be visible");
    assert.ok(restoreButton.classList.contains("min-h-11"), "Restore button should have min-h-11 on mobile");
    assert.ok(restoreButton.classList.contains("sm:min-h-9"), "Restore button should have sm:min-h-9 on desktop");
  });
});
