import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SettingsPanel } from "./settings-panel";

// Mocking Next Themes and other browser globals for JSDOM
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

  // Mock URL.createObjectURL and revokeObjectURL
  globalThis.URL.createObjectURL = () => "blob:test";
  globalThis.URL.revokeObjectURL = () => {};
}

function flushEffects() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe("SettingsPanel Markup", () => {
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

  it("renders critical interaction controls with data-testid hooks", async () => {
    setupDom();

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<SettingsPanel />);
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
});
