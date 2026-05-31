import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readThemePreference } from "@/lib/streaks/theme-preference";
import { ThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

let root: Root | null = null;
let dom: JSDOM | null = null;

describe("ThemeToggle", () => {
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

  it("applies the selected theme to html and persists it", async () => {
    setupDom();

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeToggle />
        </ThemeProvider>
      );
      await flushEffects();
    });

    const darkToggle = document.querySelector<HTMLButtonElement>(
      '[data-testid="theme-toggle-dark"]'
    );

    assert.ok(darkToggle);

    await act(async () => {
      darkToggle.dispatchEvent(
        new window.MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await flushEffects();
    });

    assert.equal(document.documentElement.classList.contains("dark"), true);
    assert.equal(readThemePreference(window.localStorage), "dark");
  });
});

function setupDom() {
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://streakbeacon.test"
  });

  const { window } = dom;

  globalThis.window = window as unknown as Window & typeof globalThis;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
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
}

function flushEffects() {
  return new Promise((resolve) => {
    queueMicrotask(resolve);
  });
}
