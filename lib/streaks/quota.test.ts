import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createEmptyStreakData } from "./model";
import { isQuotaExceededError, LocalStreakStorageAdapter } from "./storage";
import { StreakStore } from "./store";

class QuotaExceededStorage {
  getItem(): string | null {
    return null;
  }
  setItem(): void {
    const err = new Error("Quota exceeded");
    err.name = "QuotaExceededError";
    throw err;
  }
  removeItem(): void {
    const err = new Error("Quota exceeded");
    err.name = "QuotaExceededError";
    throw err;
  }
}

class GenericErrorStorage {
  getItem(): string | null {
    return null;
  }
  setItem(): void {
    throw new Error("Generic failure");
  }
  removeItem(): void {
    throw new Error("Generic failure");
  }
}

describe("Quota Error Handling", () => {
  it("identifies standard QuotaExceededError names", () => {
    const err = new Error("Full");
    err.name = "QuotaExceededError";
    assert.ok(isQuotaExceededError(err));

    const ffErr = new Error("Full");
    ffErr.name = "NS_ERROR_DOM_QUOTA_REACHED";
    assert.ok(isQuotaExceededError(ffErr));
  });

  it("identifies legacy QuotaExceededError codes", () => {
    const err = new Error("Full") as Error & { code: number };
    err.code = 22;
    assert.ok(isQuotaExceededError(err));

    const ffErr = new Error("Full") as Error & { code: number };
    ffErr.code = 1014;
    assert.ok(isQuotaExceededError(ffErr));
  });

  it("does not misidentify generic errors", () => {
    assert.strictEqual(isQuotaExceededError(new Error("Generic")), false);
    assert.strictEqual(isQuotaExceededError({ name: "QuotaExceededError" }), false);
  });

  it("StreakStore reports quota errors through onError and lastError property", () => {
    let reportedError: unknown = null;
    const adapter = new LocalStreakStorageAdapter(new QuotaExceededStorage());
    const store = new StreakStore(adapter, (err) => {
      reportedError = err;
    });

    const data = createEmptyStreakData(new Date("2026-05-27T12:00:00.000Z"));

    // Test createItem (which calls commit)
    const result = store.createItem({ id: "test", name: "Test", now: new Date() });

    assert.ok(isQuotaExceededError(reportedError));
    assert.ok(isQuotaExceededError(store.lastError));
    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].name, "Test");

    // Test replaceData
    reportedError = null;
    store.lastError = null;
    const replaced = store.replaceData(data);
    assert.ok(isQuotaExceededError(reportedError));
    assert.ok(isQuotaExceededError(store.lastError));
    assert.strictEqual(replaced.schemaVersion, 1);

    // Test reset
    reportedError = null;
    store.lastError = null;
    store.reset();
    assert.ok(isQuotaExceededError(reportedError));
    assert.ok(isQuotaExceededError(store.lastError));
  });

  it("StreakStore reports generic errors through onError and lastError property", () => {
    let reportedError: unknown = null;
    const adapter = new LocalStreakStorageAdapter(new GenericErrorStorage());
    const store = new StreakStore(adapter, (err) => {
      reportedError = err;
    });

    store.createItem({ id: "test", name: "Test", now: new Date() });
    assert.ok(reportedError instanceof Error);
    assert.ok(store.lastError instanceof Error);
    if (reportedError instanceof Error && store.lastError instanceof Error) {
      assert.strictEqual(reportedError.message, "Generic failure");
      assert.strictEqual(store.lastError.message, "Generic failure");
    }
    assert.strictEqual(isQuotaExceededError(reportedError), false);
    assert.strictEqual(isQuotaExceededError(store.lastError), false);
  });});
