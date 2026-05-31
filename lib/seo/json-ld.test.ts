import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSoftwareApplicationJsonLd } from "./json-ld";

describe("JSON-LD builder", () => {
  it("builds a valid SoftwareApplication payload with default base URL", () => {
    const payload = buildSoftwareApplicationJsonLd();

    assert.equal(payload["@context"], "https://schema.org");
    assert.equal(payload["@type"], "SoftwareApplication");
    assert.equal(payload.name, "StreakBeacon");
    assert.equal(payload.applicationCategory, "ProductivityApplication");
    assert.equal(payload.operatingSystem, "Web");
    assert.ok(payload.url.startsWith("http"), `url should be absolute, got ${payload.url}`);
    assert.deepEqual(payload.offers, {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    });
  });

  it("honors the provided base URL", () => {
    const baseUrl = "https://custom.example.com";
    const payload = buildSoftwareApplicationJsonLd(baseUrl);

    assert.equal(payload.url, "https://custom.example.com/");
  });
});
