import { describe, it } from "node:test";
import assert from "node:assert";
import { getExampleData } from "./seed";

describe("getExampleData", () => {
  it("generates a non-empty streak data set", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    const data = getExampleData(now);

    assert.strictEqual(data.items.length, 3);
    assert.ok(data.items.some(i => i.name === "Meditation"));
    assert.ok(data.items.some(i => i.name === "Reading"));
    assert.ok(data.items.some(i => i.name === "Daily Workout"));

    const totalCompletions = Object.values(data.completions).reduce(
      (acc, itemComps) => acc + Object.keys(itemComps).length,
      0
    );
    assert.ok(totalCompletions > 0);
  });

  it("assigns completions to the correct items", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    const data = getExampleData(now);

    const meditation = data.items.find(i => i.name === "Meditation")!;
    const reading = data.items.find(i => i.name === "Reading")!;

    assert.ok(Object.keys(data.completions[meditation.id]).length > 0);
    assert.ok(Object.keys(data.completions[reading.id]).length > 0);
  });
});
