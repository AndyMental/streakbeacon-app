import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createEmptyStreakData } from "./model";
import {
  isQuotaExceededError,
  LocalStreakStorageAdapter
} from "./storage";
import { StreakStore } from "./store";

class QuotaExceededStorage {
  getItem(): string | null {
    return null;
  }
  setItem(): void {
    const err = new DOMException("The quota has been exceeded.", "QuotaExceededError");
    throw err;
  }
  removeItem(): void {}
}

class FirefoxQuotaExceededStorage {
  getItem(): string | null {
    return null;
  }
  setItem(): void {
    const err = new DOMException("Persistent storage maximum size reached", "NS_ERROR_DOM_QUOTA_REACHED");
    throw err;
  }
  removeItem(): void {}
}

class GenericErrorStorage {
  getItem(): string | null {
    return null;
  }
  setItem(): void {
    throw new Error("Generic failure");
  }
  removeItem(): void {}
}

describe("Quota Error Handling", () => {
  it("detects standard QuotaExceededError", () => {
    const err = new DOMException("foo", "QuotaExceededError");
    assert.strictEqual(isQuotaExceededError(err), true);
  });

  it("detects Firefox-specific quota error", () => {
    const err = new DOMException("foo", "NS_ERROR_DOM_QUOTA_REACHED");
    assert.strictEqual(isQuotaExceededError(err), true);
  });

  it("ignores generic errors", () => {
    const err = new Error("QuotaExceededError");
    assert.strictEqual(isQuotaExceededError(err), false);
  });

  it("StreakStore reports quota errors via onError callback", () => {
    let reportedError: unknown = null;
    const adapter = new LocalStreakStorageAdapter(new QuotaExceededStorage());
    const store = new StreakStore(adapter, {
      onError: (err) => {
        reportedError = err;
      }
    });

    assert.throws(() => {
      store.createItem({
        id: "test",
        name: "Test",
        now: new Date()
      });
    });

    assert.ok(isQuotaExceededError(reportedError));
  });

  it("StreakStore reports Firefox quota errors via onError callback", () => {
    let reportedError: unknown = null;
    const adapter = new LocalStreakStorageAdapter(new FirefoxQuotaExceededStorage());
    const store = new StreakStore(adapter, {
      onError: (err) => {
        reportedError = err;
      }
    });

    assert.throws(() => {
      store.replaceData(createEmptyStreakData());
    });

    assert.ok(isQuotaExceededError(reportedError));
  });

  it("StreakStore does not report generic storage failures (non-fatal)", () => {
    let reportedError: unknown = null;
    const adapter = new LocalStreakStorageAdapter(new GenericErrorStorage());
    const store = new StreakStore(adapter, {
      onError: (err) => {
        reportedError = err;
      }
    });

    // Should not throw and should not report because it's swallowed in adapter
    store.createItem({
      id: "test",
      name: "Test",
      now: new Date()
    });

    assert.strictEqual(reportedError, null);
  });
});
