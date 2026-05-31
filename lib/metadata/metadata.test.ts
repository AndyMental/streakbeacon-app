import assert from "node:assert";
import { describe, it, afterEach } from "node:test";
import { getBaseUrl } from "./index";

describe("getBaseUrl", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return NEXT_PUBLIC_SITE_URL if present", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    assert.strictEqual(getBaseUrl(), "https://example.com");
  });

  it("should return VERCEL_PROJECT_PRODUCTION_URL if NEXT_PUBLIC_SITE_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "https://prod.vercel.app";
    assert.strictEqual(getBaseUrl(), "https://prod.vercel.app");
  });

  it("should return VERCEL_URL if others are missing", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.VERCEL_URL = "streakbeacon.vercel.app";
    assert.strictEqual(getBaseUrl(), "https://streakbeacon.vercel.app");
  });

  it("should return localhost:3000 if no env vars are present", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
    assert.strictEqual(getBaseUrl(), "http://localhost:3000");
  });

  it("should prefix with https:// if missing protocol", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "example.com";
    assert.strictEqual(getBaseUrl(), "https://example.com");
  });
});
