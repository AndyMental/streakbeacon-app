import {
  addStreakItem,
  deleteStreakItem,
  mergeStreaks,
  renameStreakItem,
  setDayCompletion,
  updatePreferences,
  type CreateStreakInput,
  type IsoDate,
  type RenameStreakInput,
  type StreakData,
  type StreakPreferences
} from "./model";
import { LocalStreakStorageAdapter } from "./storage";

export class StreakStore {
  constructor(
    private readonly storage: LocalStreakStorageAdapter,
    private readonly options?: { onError?: (err: unknown) => void }
  ) {}

  getSnapshot(): StreakData {
    return this.storage.load();
  }

  createItem(input: CreateStreakInput): StreakData {
    return this.commit(addStreakItem(this.storage.load(), input), input.now);
  }

  renameItem(input: RenameStreakInput): StreakData {
    return this.commit(renameStreakItem(this.storage.load(), input), input.now);
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
    try {
      return this.storage.replace(data, now);
    } catch (error) {
      this.options?.onError?.(error);
      throw error;
    }
  }

  mergeData(data: StreakData, now = new Date()): StreakData {
    return this.commit(mergeStreaks(this.storage.load(), data, now), now);
  }

  reset(): void {
    this.storage.reset();
  }

  private commit(data: StreakData, savedAt: Date): StreakData {
    try {
      this.storage.save(data, savedAt);
    } catch (error) {
      this.options?.onError?.(error);
      throw error;
    }
    return data;
  }
}
