import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterStreakItems } from "./filter";
import type { StreakItem } from "./model";

describe("filterStreakItems", () => {
  const mockItems: StreakItem[] = [
    {
      id: "1",
      name: "Exercise",
      description: "Daily workout",
      color: "#000",
      createdAt: "",
      updatedAt: "",
      order: 0,
      archivedAt: null,
    },
    {
      id: "2",
      name: "Read",
      description: "Read a book",
      color: "#000",
      createdAt: "",
      updatedAt: "",
      order: 1,
      archivedAt: null,
    },
    {
      id: "3",
      name: "Meditation",
      description: "Quiet time",
      color: "#000",
      createdAt: "",
      updatedAt: "",
      order: 2,
      archivedAt: null,
    },
  ];

  it("returns all items when query is empty", () => {
    assert.deepEqual(filterStreakItems(mockItems, ""), mockItems);
    assert.deepEqual(filterStreakItems(mockItems, "  "), mockItems);
  });

  it("filters by name (case-insensitive)", () => {
    const results = filterStreakItems(mockItems, "exe");
    assert.equal(results.length, 1);
    assert.equal(results[0].name, "Exercise");
  });

  it("filters by description (case-insensitive)", () => {
    const results = filterStreakItems(mockItems, "book");
    assert.equal(results.length, 1);
    assert.equal(results[0].name, "Read");
  });

  it("returns items matching either name or description", () => {
    const results = filterStreakItems(mockItems, "i");
    // ExercIse, MedItatIon
    assert.equal(results.length, 2);
    const names = results.map((r) => r.name);
    assert.ok(names.includes("Exercise"));
    assert.ok(names.includes("Meditation"));
  });

  it("returns empty array when no matches found", () => {
    assert.equal(filterStreakItems(mockItems, "xyz").length, 0);
  });
});
