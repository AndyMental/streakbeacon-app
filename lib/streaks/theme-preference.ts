import type { ThemePreference } from "./model";
import { LocalStreakStorageAdapter, type KeyValueStorage } from "./storage";
import { StreakStore } from "./store";

export function applyThemePreference(
  storage: KeyValueStorage,
  theme: ThemePreference
): ThemePreference {
  const store = new StreakStore(new LocalStreakStorageAdapter(storage));
  return store.updatePreferences({ theme }).preferences.theme;
}

export function readThemePreference(storage: KeyValueStorage): ThemePreference {
  const store = new StreakStore(new LocalStreakStorageAdapter(storage));
  return store.getSnapshot().preferences.theme;
}
