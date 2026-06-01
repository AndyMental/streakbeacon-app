import type { StreakItem } from "./model";

/**
 * Filters streak items based on a search query.
 * Matches against name and description (case-insensitive).
 */
export function filterStreakItems(
  items: StreakItem[],
  query: string
): StreakItem[] {
  const trimmedQuery = query.trim().toLowerCase();

  if (!trimmedQuery) {
    return items;
  }

  return items.filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(trimmedQuery);
    const descriptionMatch = item.description.toLowerCase().includes(trimmedQuery);
    return nameMatch || descriptionMatch;
  });
}
