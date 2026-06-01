import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useHabitSelection } from "./useHabitSelection";

let root: Root | null = null;
let dom: JSDOM | null = null;

describe("useHabitSelection", () => {
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

  it("manages selected habit id and allows null for 'All Habits'", async () => {
    setupDom();

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    let currentSelection: string | null | undefined;
    let selectHabit: ((id: string | null) => void) | undefined;

    function TestComponent() {
      const selection = useHabitSelection("initial-id");
      currentSelection = selection.selectedHabitId;
      selectHabit = selection.selectHabit;
      return null;
    }

    await act(async () => {
      root?.render(<TestComponent />);
    });

    assert.equal(currentSelection, "initial-id");

    await act(async () => {
      selectHabit?.("new-id");
    });
    assert.equal(currentSelection, "new-id");

    await act(async () => {
      selectHabit?.(null);
    });
    assert.equal(currentSelection, null);
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
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
}
