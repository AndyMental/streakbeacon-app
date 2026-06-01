import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { StreakDashboard } from "./streak-dashboard";
import { addStreakItem, createEmptyStreakData } from "@/lib/streaks/model";
import { STREAK_STORAGE_KEY } from "@/lib/streaks/storage";

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
  globalThis.DOMException = window.DOMException;
  globalThis.localStorage = window.localStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  (window as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: window.navigator
  });
}

function flushEffects() {
  return new Promise((resolve) => {
    setTimeout(resolve, 150);
  });
}

async function clickElement(element: Element) {
  await act(async () => {
    element.dispatchEvent(
      new window.MouseEvent("click", { bubbles: true, cancelable: true })
    );
    await flushEffects();
  });
}

describe("StreakDashboard accessibility", () => {
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

  it("announces the selected streak selector button with aria-pressed", async () => {
    setupDom();
    seedTwoHabits();

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<StreakDashboard />);
      await flushEffects();
    });

    const morningWalk = findButton("Morning walk");
    const shipping = findButton("Ship one useful change");

    assert.equal(morningWalk.getAttribute("aria-pressed"), "true");
    assert.equal(shipping.getAttribute("aria-pressed"), "false");

    await clickElement(shipping);

    assert.equal(morningWalk.getAttribute("aria-pressed"), "false");
    assert.equal(shipping.getAttribute("aria-pressed"), "true");
  });

  it("uses date current state and a descriptive toggle label for the selected day", async () => {
    setupDom();
    seedTwoHabits();

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<StreakDashboard />);
      await flushEffects();
    });

    const selectedDay = document.querySelector('button[aria-current="date"]');
    assert.ok(selectedDay, "Selected calendar day should expose aria-current");

    const toggleButton = Array.from(document.querySelectorAll("button")).find(
      (button) => button.getAttribute("aria-label")?.startsWith("Mark complete for ")
    );

    assert.ok(
      toggleButton,
      "Selected-day toggle should include the target date in its accessible name"
    );
  });
});

function findButton(text: string) {
  const button = Array.from(document.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === text
  );

  assert.ok(button, `Expected to find button "${text}"`);
  return button;
}

function seedTwoHabits() {
  const now = new Date("2026-05-27T12:00:00.000Z");
  let data = createEmptyStreakData(now);

  data = addStreakItem(data, {
    id: "morning-walk",
    name: "Morning walk",
    now
  });
  data = addStreakItem(data, {
    id: "ship-change",
    name: "Ship one useful change",
    now
  });

  window.localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
}
