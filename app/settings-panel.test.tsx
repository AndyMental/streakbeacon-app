import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SettingsPanel } from "./settings-panel";
import { ThemeProvider } from "./theme-provider";

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

  // Mock ResizeObserver which is used by Radix UI / shadcn
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock PointerEvent which is used by Radix UI
  globalThis.PointerEvent = class PointerEvent extends window.MouseEvent {
    constructor(type: string, props: MouseEventInit = {}) {
      super(type, props);
    }
  } as unknown as typeof PointerEvent;

  // Mock URL.createObjectURL and revokeObjectURL
  globalThis.URL.createObjectURL = () => "blob:test";
  globalThis.URL.revokeObjectURL = () => {};
}

function flushEffects() {
  return new Promise((resolve) => {
    setTimeout(resolve, 150); // Increased for stability
  });
}

async function clickElement(element: Element) {
  await act(async () => {
    element.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    await flushEffects();
  });
}

describe("SettingsPanel Interaction Evidence", () => {
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
  });

  it("renders critical interaction controls with data-testid hooks", async () => {
    setupDom();

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <ThemeProvider attribute="class" defaultTheme="system">
          <SettingsPanel />
        </ThemeProvider>
      );
      await flushEffects();
    });

    const testIds = [
      "settings-theme-system",
      "settings-theme-light",
      "settings-theme-dark",
      "settings-export-json",
      "settings-import-json",
      "settings-import-paste",
      "settings-reset-data"
    ];

    for (const id of testIds) {
      const element = document.querySelector(`[data-testid="${id}"]`);
      assert.ok(element, `Missing element with data-testid="${id}"`);
    }
  });

  it("updates the theme class on documentElement when a theme toggle item is clicked", async () => {
    setupDom();

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <ThemeProvider attribute="class" defaultTheme="system">
          <SettingsPanel />
        </ThemeProvider>
      );
      await flushEffects();
    });

    const lightToggle = document.querySelector<HTMLButtonElement>(
      '[data-testid="settings-theme-light"]'
    );
    assert.ok(lightToggle);

    await clickElement(lightToggle);
    assert.equal(document.documentElement.classList.contains("light"), true, "Document should have 'light' class");

    const darkToggle = document.querySelector<HTMLButtonElement>(
      '[data-testid="settings-theme-dark"]'
    );
    assert.ok(darkToggle);

    await clickElement(darkToggle);
    assert.equal(document.documentElement.classList.contains("dark"), true, "Document should have 'dark' class");
  });

  it("triggers a download with valid filename when Export JSON is clicked", async () => {
    setupDom();

    const link = {
      href: "",
      download: "",
      click: () => {},
      remove: () => {}
    } as unknown as HTMLAnchorElement;

    const originalCreate = document.createElement.bind(document);
    document.createElement = ((tagName: string) => {
      if (tagName === "a") return link;
      return originalCreate(tagName);
    }) as unknown as typeof document.createElement;

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <ThemeProvider attribute="class" defaultTheme="system">
          <SettingsPanel />
        </ThemeProvider>
      );
      await flushEffects();
    });

    const exportButton = document.querySelector<HTMLButtonElement>(
      '[data-testid="settings-export-json"]'
    );
    assert.ok(exportButton);

    await clickElement(exportButton);

    assert.ok(link.href.startsWith("blob:"), "Should create a blob URL");
    assert.ok(link.download.startsWith("streakbeacon-export-"), "Should set correct download filename prefix");

    document.createElement = originalCreate;
  });

  it("renders data counts from storage snapshot", async () => {
    setupDom();

    // Mock storage to have some data
    const testData = {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        { id: "i1", name: "Habit 1", color: "#27AE60", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), order: 0, archivedAt: null },
        { id: "i2", name: "Habit 2", color: "#27AE60", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), order: 1, archivedAt: null }
      ],
      completions: {
        i1: { "2026-05-31": { completedAt: new Date().toISOString(), source: "manual" } },
        i2: {}
      },
      preferences: { theme: "system", weekStartsOn: 0, gridWindowDays: 365, showArchived: false, accentColor: "#27AE60" }
    };
    window.localStorage.setItem("streakbeacon:data:v1", JSON.stringify(testData));

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <ThemeProvider attribute="class" defaultTheme="system">
          <SettingsPanel />
        </ThemeProvider>
      );
      await flushEffects();
    });

    const dds = Array.from(document.querySelectorAll("dd"));
    assert.equal(dds[0]?.textContent, "2", "Should show 2 items count");
    assert.equal(dds[1]?.textContent, "1", "Should show 1 days count");
  });
});
