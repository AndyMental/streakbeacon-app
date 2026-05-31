import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../../app/page";

describe("home page", () => {
  it("renders the main landmark with the correct id for the skip link", () => {
    const markup = renderToStaticMarkup(createElement(Home));
    assert.match(markup, /<main[^>]*id="main-content"[^>]*>/);
  });
});
