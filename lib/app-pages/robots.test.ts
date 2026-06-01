import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import robots from "../../app/robots";

const ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL"
] as const;

describe("robots metadata route", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  });

  it("emits an absolute sitemap URL derived from NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://streakbeacon.example.com";

    const result = robots();

    assert.equal(
      result.sitemap,
      "https://streakbeacon.example.com/sitemap.xml"
    );
    assert.deepEqual(result.rules, [{ userAgent: "*", allow: "/" }]);
  });

  it("prefixes https:// when the configured URL lacks a scheme", () => {
    process.env.VERCEL_URL = "streakbeacon.vercel.app";

    const result = robots();

    assert.equal(
      result.sitemap,
      "https://streakbeacon.vercel.app/sitemap.xml"
    );
  });

  it("falls back to http://localhost:3000 when no env var is set", () => {
    const result = robots();

    assert.equal(result.sitemap, "http://localhost:3000/sitemap.xml");
  });
});
