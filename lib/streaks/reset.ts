import { createEmptyStreakData, type StreakData } from "./model";
import { STREAK_DATA_CHANGED_EVENT } from "./storage";
import type { StreakStore } from "./store";

type ResettableStore = Pick<StreakStore, "reset">;

export function confirmResetAllData(
  store: ResettableStore,
  now = new Date()
): StreakData {
  store.reset();
  return createEmptyStreakData(now);
}

export function cancelResetAllData(current: StreakData): StreakData {
  return current;
}

export function dispatchStreakDataReset(target: EventTarget): void {
  target.dispatchEvent(new Event(STREAK_DATA_CHANGED_EVENT));
}
