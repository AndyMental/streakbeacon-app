import { validateImportText, type ImportPreview } from "./storage";

export type ImportInputKind = "file" | "paste";

export type ImportInput = {
  kind: ImportInputKind;
  text: string;
};

export type ImportInputEvaluation = {
  preview: ImportPreview | null;
  importError: string | null;
};

export const EMPTY_FILE_MESSAGE = "The selected file is empty.";
export const EMPTY_PASTE_MESSAGE = "Paste exported JSON before previewing.";

export function evaluateImportInput(
  input: ImportInput
): ImportInputEvaluation {
  if (!input.text.trim()) {
    return {
      preview: null,
      importError:
        input.kind === "file" ? EMPTY_FILE_MESSAGE : EMPTY_PASTE_MESSAGE
    };
  }

  const result = validateImportText(input.text);

  if (!result.ok) {
    return {
      preview: null,
      importError: result.errors.join(" ")
    };
  }

  return {
    preview: result.preview,
    importError: null
  };
}
