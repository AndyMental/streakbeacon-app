import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import NotFound from "../../app/not-found";

describe("404 not-found page", () => {
  const markup = renderToStaticMarkup(createElement(NotFound));

  it("renders the not-found heading", () => {
    assert.match(markup, /Page not found/);
  });

  it("renders the back-to-home link pointing to /", () => {
    assert.match(markup, /<a[^>]*href="\/"[^>]*>/);
    assert.match(markup, /data-testid="not-found-home-link"/);
    assert.match(markup, /Back to home/);
  });

  it("exposes a skip-to-main-content anchor before the main landmark", () => {
    const skipIndex = markup.search(/<a[^>]*href="#main"[^>]*>\s*Skip to main content/);
    const mainIndex = markup.search(/<main[^>]*id="main"/);
    assert.ok(skipIndex >= 0, "skip-to-main-content anchor must render");
    assert.ok(mainIndex >= 0, "main landmark with id=\"main\" must render");
    assert.ok(skipIndex < mainIndex, "skip link must precede the main landmark");
  });
});
