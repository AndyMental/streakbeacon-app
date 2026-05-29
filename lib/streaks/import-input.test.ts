import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_FILE_MESSAGE,
  EMPTY_PASTE_MESSAGE,
  evaluateImportInput
} from "./import-input";
import {
  addStreakItem,
  createEmptyStreakData,
  createExportEnvelope,
  setDayCompletion,
  updatePreferences
} from "./model";

function exportedSampleText() {
  const now = new Date("2026-05-27T12:00:00.000Z");
  const data = setDayCompletion(
    updatePreferences(
      addStreakItem(createEmptyStreakData(now), {
        id: "read",
        name: "Read",
        now
      }),
      { theme: "dark" },
      now
    ),
    "read",
    "2026-05-27",
    true,
    now
  );

  return JSON.stringify(createExportEnvelope(data, now));
}

describe("evaluateImportInput", () => {
  it("returns a preview for a valid envelope from a file input", () => {
    const result = evaluateImportInput({
      kind: "file",
      text: exportedSampleText()
    });

    assert.equal(result.importError, null);
    assert.notEqual(result.preview, null);
    assert.equal(result.preview?.itemCount, 1);
    assert.equal(result.preview?.completionCount, 1);
    assert.equal(result.preview?.data.preferences.theme, "dark");
  });

  it("returns a preview for a valid envelope from a paste input", () => {
    const result = evaluateImportInput({
      kind: "paste",
      text: exportedSampleText()
    });

    assert.equal(result.importError, null);
    assert.equal(result.preview?.itemCount, 1);
  });

  it("rejects invalid JSON from a file input without a preview", () => {
    const result = evaluateImportInput({ kind: "file", text: "{bad" });

    assert.equal(result.preview, null);
    assert.match(result.importError ?? "", /valid JSON/);
  });

  it("rejects invalid JSON from a paste input without a preview", () => {
    const result = evaluateImportInput({
      kind: "paste",
      text: JSON.stringify({ format: "other" })
    });

    assert.equal(result.preview, null);
    assert.equal(typeof result.importError, "string");
    assert.notEqual(result.importError, "");
  });

  it("rejects an empty file with the file-specific empty message", () => {
    const result = evaluateImportInput({ kind: "file", text: "" });

    assert.equal(result.preview, null);
    assert.equal(result.importError, EMPTY_FILE_MESSAGE);
  });

  it("rejects whitespace-only file content as empty", () => {
    const result = evaluateImportInput({ kind: "file", text: "   \n\t" });

    assert.equal(result.preview, null);
    assert.equal(result.importError, EMPTY_FILE_MESSAGE);
  });

  it("rejects an empty paste with the paste-specific empty message", () => {
    const result = evaluateImportInput({ kind: "paste", text: "" });

    assert.equal(result.preview, null);
    assert.equal(result.importError, EMPTY_PASTE_MESSAGE);
  });
});
