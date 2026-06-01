"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  createEmptyStreakData, 
  type StreakData 
} from "./model";
import { 
  assertStorageWritable, 
  LocalStreakStorageAdapter, 
  STREAK_DATA_CHANGED_EVENT 
} from "./storage";
import { StreakStore } from "./store";

function createBrowserStore() {
  if (typeof window === "undefined") return null;
  try {
    assertStorageWritable(window.localStorage);
    return new StreakStore(new LocalStreakStorageAdapter(window.localStorage));
  } catch {
    return null;
  }
}

export function useStreakData() {
  const [data, setData] = useState<StreakData>(() => createEmptyStreakData());
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState<boolean>(false);

  const store = useMemo(() => createBrowserStore(), []);

  useEffect(() => {
    let cancelled = false;

    const loadSnapshot = () => {
      if (cancelled) return;

      if (!store) {
        setStorageError(true);
        setIsReady(true);
        return;
      }

      try {
        setData(store.getSnapshot());
        setStorageError(false);
      } catch {
        setStorageError(true);
      } finally {
        setIsReady(true);
      }
    };

    queueMicrotask(loadSnapshot);
    window.addEventListener(STREAK_DATA_CHANGED_EVENT, loadSnapshot);

    return () => {
      cancelled = true;
      window.removeEventListener(STREAK_DATA_CHANGED_EVENT, loadSnapshot);
    };
  }, [store]);

  return {
    data,
    setData,
    isReady,
    storageError,
    store
  };
}
