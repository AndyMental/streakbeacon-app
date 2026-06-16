import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const layoutSource = readFileSync("app/layout.tsx", "utf8");
const pageSource = readFileSync("app/page.tsx", "utf8");
const loadingSource = readFileSync("app/loading.tsx", "utf8");

describe("skip-to-main-content link", () => {
  it("is the first layout child and points to the main landmark", () => {
    const linkIndex = layoutSource.indexOf('data-testid="skip-link"');
    const childrenIndex = layoutSource.indexOf("{children}");

    assert.ok(linkIndex > -1, "skip link must exist in the root layout");
    assert.ok(childrenIndex > -1, "layout must render children");
    assert.ok(
      linkIndex < childrenIndex,
      "skip link must render before children"
    );
    assert.match(
      layoutSource,
      /import \{ Button \} from "@\/components\/ui\/button";/
    );
    assert.match(
      layoutSource,
      /<Button\s+[\s\S]*asChild[\s\S]*data-testid="skip-link"[\s\S]*>\s*<a href="#main-content">/
    );
    assert.match(layoutSource, /className="[^"]*\bsr-only\b[^"]*"/);
    assert.match(layoutSource, /className="[^"]*\bfocus:not-sr-only\b[^"]*"/);
    assert.match(layoutSource, /className="[^"]*\bfocus:absolute\b[^"]*"/);
    assert.match(layoutSource, /className="[^"]*\bfocus:z-50\b[^"]*"/);
    assert.match(layoutSource, /className="[^"]*\bfocus:ring-2\b[^"]*"/);
    assert.doesNotMatch(layoutSource, /<SkipLink\s*\/>/);
  });

  it("pairs the skip-link href with the dashboard main id", () => {
    assert.match(layoutSource, /href="#main-content"/);
    assert.match(pageSource, /<main[^>]*id="main-content"/);
    assert.match(pageSource, /<main[^>]*tabIndex=\{-1\}/);
  });

  it("mirrors the main target on the loading fallback", () => {
    assert.match(loadingSource, /<main[^>]*id="main-content"/);
    assert.match(loadingSource, /<main[^>]*tabIndex=\{-1\}/);
  });
});
