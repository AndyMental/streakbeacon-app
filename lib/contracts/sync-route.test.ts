import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { NextRequest } from "next/server";

import { GET, POST } from "../../app/api/sync/route";
import { createEmptyStreakData } from "../streaks/model";

function request(init: RequestInit & { url?: string } = {}): NextRequest {
  return new Request(
    init.url ?? "https://streakbeacon.test/api/sync",
    init
  ) as unknown as NextRequest;
}

describe("/api/sync route contract", () => {
  it("returns 401 without bearer auth for GET", async () => {
    const response = GET(request());

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Unauthorized" });
  });

  it("returns an empty StreakData object for authenticated GET", async () => {
    const response = GET(
      request({
        headers: { authorization: "Bearer local-test-token" },
      })
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.schemaVersion, 2);
    assert.deepEqual(body.items, []);
    assert.deepEqual(body.completions, {});
    assert.equal(body.preferences.theme, "system");
    assert.equal(body.preferences.weekStartsOn, 0);
    assert.equal(body.preferences.gridWindowDays, 365);
    assert.equal(body.preferences.showArchived, false);
    assert.equal(body.preferences.accentColor, "#27AE60");
  });

  it("returns 401 without bearer auth for POST", async () => {
    const response = await POST(
      request({
        method: "POST",
        body: JSON.stringify(createEmptyStreakData()),
      })
    );

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Unauthorized" });
  });

  it("returns normalized StreakData for authenticated POST", async () => {
    const data = createEmptyStreakData(new Date("2026-06-02T00:00:00.000Z"));
    const response = await POST(
      request({
        method: "POST",
        headers: {
          authorization: "Bearer local-test-token",
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      })
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), data);
  });

  it("returns 400 for invalid authenticated POST data", async () => {
    const response = await POST(
      request({
        method: "POST",
        headers: {
          authorization: "Bearer local-test-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          schemaVersion: 99,
          items: "not an array",
        }),
      })
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid data provided" });
  });
});
