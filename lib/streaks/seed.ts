import {
  addStreakItem,
  createEmptyStreakData,
  setDayCompletion,
  type IsoDate,
  type StreakData
} from "./model";

export function getExampleData(now = new Date()): StreakData {
  let data = createEmptyStreakData(now);

  const items = [
    {
      id: "meditation",
      name: "Meditation",
      completions: [1, 2, 3, 5, 6, 7, 8, 9, 10] // days ago
    },
    {
      id: "reading",
      name: "Reading",
      completions: [0, 1, 2, 4, 5, 7, 8, 10]
    },
    {
      id: "workout",
      name: "Daily Workout",
      completions: [1, 3, 5, 7, 9]
    }
  ];

  for (const item of items) {
    data = addStreakItem(data, {
      id: item.id,
      name: item.name,
      now
    });

    for (const daysAgo of item.completions) {
      const date = new Date(now);
      date.setUTCDate(date.getUTCDate() - daysAgo);
      const isoDate = date.toISOString().slice(0, 10) as IsoDate;
      data = setDayCompletion(data, item.id, isoDate, true, now);
    }
  }

  return data;
}
