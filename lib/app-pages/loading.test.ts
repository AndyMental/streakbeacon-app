import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Loading from "../../app/loading";

describe("dashboard loading page", () => {
  const markup = renderToStaticMarkup(createElement(Loading));

  it("exposes a stable testid for black-box selectors", () => {
    assert.match(markup, /data-testid="dashboard-loading"/);
  });

  it("announces the loading state to assistive tech", () => {
    assert.match(markup, /role="status"/);
    assert.match(markup, /aria-busy="true"/);
    assert.match(markup, /aria-live="polite"/);
    assert.match(markup, /Loading StreakBeacon/);
  });

  it("preserves the skip-link target", () => {
    assert.match(markup, /id="main-content"/);
    assert.match(markup, /tabindex="-1"/i);
  });

  it("renders skeleton placeholders for the three dashboard regions", () => {
    const pulseMatches = markup.match(/animate-pulse/g) ?? [];
    assert.ok(
      pulseMatches.length >= 3,
      `expected at least 3 skeleton placeholders, got ${pulseMatches.length}`
    );
  });
});
