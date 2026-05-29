import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../../app/page";

describe("home page JSON-LD structured data", () => {
  const markup = renderToStaticMarkup(createElement(Home));

  it("renders an application/ld+json script tag", () => {
    assert.match(
      markup,
      /<script[^>]*type="application\/ld\+json"[^>]*>/,
      "expected a JSON-LD script tag on the home page"
    );
    assert.match(markup, /data-testid="home-jsonld"/);
  });

  it("emits a parseable SoftwareApplication payload with required schema.org fields", () => {
    const match = markup.match(
      /<script[^>]*data-testid="home-jsonld"[^>]*>([\s\S]*?)<\/script>/
    );
    assert.ok(match, "expected JSON-LD script body to be present");

    const payload = JSON.parse(match[1]);

    assert.equal(payload["@context"], "https://schema.org");
    assert.equal(payload["@type"], "SoftwareApplication");
    assert.equal(typeof payload.name, "string");
    assert.ok(payload.name.length > 0, "name must be non-empty");
    assert.equal(payload.applicationCategory, "ProductivityApplication");
    assert.equal(payload.operatingSystem, "Web");
    assert.equal(typeof payload.url, "string");
    assert.ok(
      /^https?:\/\//.test(payload.url),
      `url must be absolute, got ${payload.url}`
    );
    assert.deepEqual(payload.offers, {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    });
  });
});
