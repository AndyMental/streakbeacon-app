import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ErrorPage from "../../app/error";
import GlobalErrorPage from "../../app/global-error";

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
});
