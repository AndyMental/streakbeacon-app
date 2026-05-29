import { LocalStreakStorageAdapter, type KeyValueStorage } from "./storage";
import { StreakStore } from "./store";

export const STORAGE_UNAVAILABLE_TITLE = "Storage unavailable";

export const DASHBOARD_STORAGE_UNAVAILABLE_MESSAGE =
  "Local streak data is unavailable in this browser. You can still review the page, but completion changes will not be saved.";

export const SETTINGS_STORAGE_UNAVAILABLE_MESSAGE =
  "Browser storage is unavailable. Settings and import changes cannot be saved right now.";

export type StorageUnavailableAlert = {
  title: typeof STORAGE_UNAVAILABLE_TITLE;
  description: string;
};

export type BrowserStoreResult =
  | {
      ok: true;
      store: StreakStore;
    }
  | {
      ok: false;
      alert: StorageUnavailableAlert;
    };

export function createBrowserStreakStore(storage: KeyValueStorage) {
  return new StreakStore(new LocalStreakStorageAdapter(storage));
}

export function resolveBrowserStreakStore(
  getStorage: () => KeyValueStorage,
  unavailableDescription: string
): BrowserStoreResult {
  try {
    return {
      ok: true,
      store: createBrowserStreakStore(getStorage())
    };
  } catch {
    return {
      ok: false,
      alert: {
        title: STORAGE_UNAVAILABLE_TITLE,
        description: unavailableDescription
      }
    };
  }
}
