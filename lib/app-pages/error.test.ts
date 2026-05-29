import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement, isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ErrorPage from "../../app/error";
import GlobalErrorPage from "../../app/global-error";

function findElementByTestId(
  node: unknown,
  testId: string
): ReactElement | null {
  if (!isValidElement(node)) {
    if (Array.isArray(node)) {
      for (const child of node) {
        const match = findElementByTestId(child, testId);
        if (match) return match;
      }
    }
    return null;
  }

  const props = node.props as Record<string, unknown> | null;

  if (props && props["data-testid"] === testId) {
    return node;
  }

  if (props && "children" in props) {
    return findElementByTestId(props.children, testId);
  }

  return null;
}

describe("error page fallbacks", () => {
  it("renders the route error fallback with a stable reset target", () => {
    const markup = renderToStaticMarkup(
      createElement(ErrorPage, {
        error: new Error("route failure"),
        reset: () => undefined
      })
    );

    assert.match(markup, /Signal dropped/);
    assert.match(markup, /data-testid="error-reset"/);
    assert.match(markup, /Try again/);
  });

  it("exposes a skip-to-main-content anchor before the main landmark on the route error page", () => {
    const markup = renderToStaticMarkup(
      createElement(ErrorPage, {
        error: new Error("route failure"),
        reset: () => undefined
      })
    );

    const skipIndex = markup.search(/<a[^>]*href="#main"[^>]*>\s*Skip to main content/);
    const mainIndex = markup.search(/<main[^>]*id="main"/);
    assert.ok(skipIndex >= 0, "skip-to-main-content anchor must render");
    assert.ok(mainIndex >= 0, "main landmark with id=\"main\" must render");
    assert.ok(skipIndex < mainIndex, "skip link must precede the main landmark");
  });

  it("exposes a skip-to-main-content anchor before the main landmark on the global error page", () => {
    const markup = renderToStaticMarkup(
      createElement(GlobalErrorPage, {
        error: new Error("global failure"),
        reset: () => undefined
      })
    );

    const skipIndex = markup.search(/<a[^>]*href="#main"[^>]*>\s*Skip to main content/);
    const mainIndex = markup.search(/<main[^>]*id="main"/);
    assert.ok(skipIndex >= 0, "skip-to-main-content anchor must render");
    assert.ok(mainIndex >= 0, "main landmark with id=\"main\" must render");
    assert.ok(skipIndex < mainIndex, "skip link must precede the main landmark");
  });

  it("invokes the reset prop when the route error Reset action fires", () => {
    let resetCalls = 0;
    let captured: ReactElement | null = null;

    function Capture(props: {
      error: Error & { digest?: string };
      reset: () => void;
    }) {
      captured = ErrorPage(props) as ReactElement;
      return captured;
    }

    renderToStaticMarkup(
      createElement(Capture, {
        error: new Error("route failure"),
        reset: () => {
          resetCalls += 1;
        }
      })
    );

    assert.ok(captured, "ErrorPage tree must be captured");
    const resetButton = findElementByTestId(captured, "error-reset");
    assert.ok(resetButton, "reset button must be present in the rendered tree");

    const onClick = (resetButton.props as { onClick?: () => void }).onClick;
    assert.equal(typeof onClick, "function");
    onClick?.();

    assert.equal(resetCalls, 1);
  });

  it("renders the global error fallback as a full document", () => {
    const markup = renderToStaticMarkup(
      createElement(GlobalErrorPage, {
        error: Object.assign(new Error("global failure"), {
          digest: "global-digest"
        }),
        reset: () => undefined
      })
    );

    assert.match(markup, /<html lang="en">/);
    assert.match(markup, /<body>/);
    assert.match(markup, /Signal interrupted/);
    assert.match(markup, /Error reference: global-digest/);
    assert.match(markup, /data-testid="error-reset"/);
  });

  it("invokes the reset prop when the global error Reset action fires", () => {
    let resetCalls = 0;
    const tree = GlobalErrorPage({
      error: new Error("global failure"),
      reset: () => {
        resetCalls += 1;
      }
    }) as ReactElement;

    const resetButton = findElementByTestId(tree, "error-reset");
    assert.ok(resetButton, "reset button must be present in the rendered tree");

    const onClick = (resetButton.props as { onClick?: () => void }).onClick;
    assert.equal(typeof onClick, "function");
    onClick?.();

    assert.equal(resetCalls, 1);
  });
});
