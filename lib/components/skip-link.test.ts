import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SkipLink } from "../../components/skip-link";

describe("SkipLink component", () => {
  it("renders the skip-to-main-content link with correct attributes", () => {
    const markup = renderToStaticMarkup(createElement(SkipLink));

    assert.match(markup, /href="#main-content"/);
    assert.match(markup, /data-testid="skip-link"/);
    assert.match(markup, /Skip to main content/);
    assert.match(markup, /sr-only/);
    assert.match(markup, /focus:not-sr-only/);
  });
});
