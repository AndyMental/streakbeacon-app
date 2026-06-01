import {
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";

/**
 * Manages habit selection state, including the "All Habits" (null) view.
 */
export function useHabitSelection(initialId: string | null = null) {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(
    initialId
  );

  const selectHabit: Dispatch<SetStateAction<string | null>> = useCallback(
    (value) => {
      setSelectedHabitId(value);
    },
    []
  );

  return {
    selectedHabitId,
    selectHabit,
  };
}
