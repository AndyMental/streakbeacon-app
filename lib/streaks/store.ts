import {
  addStreakItem,
  archiveStreakItem,
  deleteStreakItem,
  mergeStreaks,
  renameStreakItem,
  setDayCompletion,
  unarchiveStreakItem,
  updatePreferences,
  type CreateStreakInput,
  type IsoDate,
  type RenameStreakInput,
  type StreakData,
  type StreakPreferences,
} from "./model";
import { LocalStreakStorageAdapter } from "./storage";

export class StreakStore {
  constructor(private readonly storage: LocalStreakStorageAdapter) {}

  getSnapshot(): StreakData {
    return this.storage.load();
  }

  createItem(input: CreateStreakInput): StreakData {
    return this.commit(addStreakItem(this.storage.load(), input), input.now);
  }

  renameItem(input: RenameStreakInput): StreakData {
    return this.commit(renameStreakItem(this.storage.load(), input), input.now);
  }

  archiveItem(id: string, now = new Date()): StreakData {
    return this.commit(archiveStreakItem(this.storage.load(), id, now), now);
  }

  unarchiveItem(id: string, now = new Date()): StreakData {
    return this.commit(unarchiveStreakItem(this.storage.load(), id, now), now);
  }

  deleteItem(id: string, now = new Date()): StreakData {
    return this.commit(deleteStreakItem(this.storage.load(), id, now), now);
  }

  setCompletion(
    id: string,
    day: IsoDate,
    isComplete: boolean,
    now: Date
  ): StreakData {
    return this.commit(
      setDayCompletion(this.storage.load(), id, day, isComplete, now),
      now
    );
  }

  updatePreferences(
    preferences: Partial<StreakPreferences>,
    now = new Date()
  ): StreakData {
    return this.commit(
      updatePreferences(this.storage.load(), preferences, now),
      now
    );
  }

  replaceData(data: StreakData, now = new Date()): StreakData {
    return this.storage.replace(data, now);
  }

  mergeData(data: StreakData, now = new Date()): StreakData {
    return this.commit(mergeStreaks(this.storage.load(), data, now), now);
  }

  reset(): void {
    this.storage.reset();
  }

  private commit(data: StreakData, savedAt: Date): StreakData {
    this.storage.save(data, savedAt);
    return data;
  }
}
