"use client";

import { Download, FileJson, Moon, RotateCcw, Sun, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  createExportEnvelope,
  createEmptyStreakData,
  type StreakData,
  type ThemePreference
} from "@/lib/streaks/model";
import {
  LocalStreakStorageAdapter,
  validateImportText,
  type ImportPreview
} from "@/lib/streaks/storage";
import { StreakStore } from "@/lib/streaks/store";

function createBrowserStore() {
  return new StreakStore(new LocalStreakStorageAdapter(window.localStorage));
}

const STORAGE_ERROR_MESSAGE =
  "Browser storage is unavailable. Settings and import changes cannot be saved right now.";

export function SettingsPanel() {
  const importInputRef = useRef<HTMLInputElement>(null);
  const { setTheme } = useTheme();
  const [data, setData] = useState<StreakData>(() => createEmptyStreakData());
  const [isReady, setIsReady] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [pastedJson, setPastedJson] = useState("");

  const store = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return createBrowserStore();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setTheme(data.preferences.theme);
  }, [data.preferences.theme, setTheme]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      if (!store) {
        setIsReady(true);
        return;
      }

      try {
        setData(store.getSnapshot());
        setStorageError(null);
      } catch {
        setStorageError(STORAGE_ERROR_MESSAGE);
      } finally {
        setIsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [store]);

  function updateTheme(theme: ThemePreference) {
    if (!store) {
      setStorageError(STORAGE_ERROR_MESSAGE);
      return;
    }

    try {
      const next = store.updatePreferences({ theme });
      setData(next);
      setStorageError(null);
      setMessage("Theme preference saved.");
    } catch {
      setStorageError(STORAGE_ERROR_MESSAGE);
    }
  }

  function exportData() {
    const envelope = createExportEnvelope(data, new Date());
    const blob = new Blob([JSON.stringify(envelope, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `streakbeacon-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Export downloaded.");
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const text = await file.text();

    if (!text.trim()) {
      setPreview(null);
      setImportError("The selected file is empty.");
      setMessage(null);
      return;
    }

    applyImportText(text);
  }

  function handleImportPaste() {
    if (!pastedJson.trim()) {
      setPreview(null);
      setImportError("Paste exported JSON before previewing.");
      setMessage(null);
      return;
    }

    applyImportText(pastedJson);
  }

  function applyImportText(text: string) {
    const result = validateImportText(text);

    setMessage(null);

    if (!result.ok) {
      setPreview(null);
      setImportError(result.errors.join(" "));
      return;
    }

    setImportError(null);
    setPreview(result.preview);
  }

  function confirmImport() {
    if (!store || !preview) {
      setStorageError(STORAGE_ERROR_MESSAGE);
      return;
    }

    try {
      const next = store.replaceData(preview.data);
      setData(next);
      setPreview(null);
      setPastedJson("");
      setStorageError(null);
      setMessage("Import complete. Local data was replaced.");
    } catch {
      setStorageError(STORAGE_ERROR_MESSAGE);
    }

    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
  }

  function cancelImport() {
    setPreview(null);
    setImportError(null);
    setPastedJson("");
    setMessage("Import cancelled.");

    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
  }

  function resetLocalData() {
    if (!store) {
      setStorageError(STORAGE_ERROR_MESSAGE);
      return;
    }

    if (!resetArmed) {
      setResetArmed(true);
      setMessage("Confirm reset to clear local data.");
      return;
    }

    try {
      store.reset();
      const next = createEmptyStreakData();
      setData(next);
      setTheme(next.preferences.theme);
      setPreview(null);
      setImportError(null);
      setResetArmed(false);
      setStorageError(null);
      setMessage("Local data cleared.");
    } catch {
      setStorageError(STORAGE_ERROR_MESSAGE);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Sun className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent>
          {storageError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Storage unavailable</AlertTitle>
              <AlertDescription>{storageError}</AlertDescription>
            </Alert>
          ) : null}

          <ToggleGroup
            type="single"
            value={data.preferences.theme}
            onValueChange={(theme) => {
              if (theme) {
                updateTheme(theme as ThemePreference);
              }
            }}
            aria-label="Theme preference"
            disabled={!isReady}
          >
            {(["system", "light", "dark"] as const).map((theme) => (
              <ToggleGroupItem
                key={theme}
                value={theme}
                aria-label={`${theme} theme`}
              >
                {theme}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <FileJson className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent>
          {storageError ? (
            <Alert variant="destructive" className="mb-5">
              <AlertTitle>Storage unavailable</AlertTitle>
              <AlertDescription>{storageError}</AlertDescription>
            </Alert>
          ) : null}

          <dl className="grid grid-cols-3 gap-3 text-sm">
            <Badge
              asChild
              variant="outline"
              className="block rounded-md bg-muted p-3 font-normal"
            >
              <div>
                <dt className="text-muted-foreground">Items</dt>
                <dd className="mt-1 text-xl font-semibold">
                  {data.items.length}
                </dd>
              </div>
            </Badge>
            <Badge
              asChild
              variant="outline"
              className="block rounded-md bg-muted p-3 font-normal"
            >
              <div>
                <dt className="text-muted-foreground">Days</dt>
                <dd className="mt-1 text-xl font-semibold">
                  {Object.values(data.completions).reduce(
                    (total, itemDays) => total + Object.keys(itemDays).length,
                    0
                  )}
                </dd>
              </div>
            </Badge>
            <Badge
              asChild
              variant="outline"
              className="block rounded-md bg-muted p-3 font-normal"
            >
              <div>
                <dt className="text-muted-foreground">Window</dt>
                <dd className="mt-1 text-xl font-semibold">
                  {data.preferences.gridWindowDays}
                </dd>
              </div>
            </Badge>
          </dl>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              onClick={exportData}
              data-testid="export-json-button"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export JSON
            </Button>
            <Button asChild variant="outline" size="lg">
              <Label className="cursor-pointer" data-testid="import-json-label">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Import JSON
                <Input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  disabled={!isReady || Boolean(storageError)}
                  onChange={(event) =>
                    handleImportFile(event.target.files?.[0])
                  }
                  data-testid="import-json-file"
                />
              </Label>
            </Button>
            <Button
              type="button"
              variant={resetArmed ? "destructive" : "outline"}
              size="lg"
              onClick={resetLocalData}
              disabled={!isReady || Boolean(storageError)}
              data-testid="reset-data-button"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {resetArmed ? "Confirm Reset" : "Reset"}
            </Button>
          </div>

          <div className="mt-5 grid gap-2">
            <Label htmlFor="import-json-paste">Or paste exported JSON</Label>
            <Textarea
              id="import-json-paste"
              value={pastedJson}
              onChange={(event) => setPastedJson(event.target.value)}
              placeholder='{"format":"streakbeacon.export", ...}'
              disabled={!isReady || Boolean(storageError)}
              rows={5}
              data-testid="import-json-textarea"
            />
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={handleImportPaste}
                disabled={!isReady || Boolean(storageError)}
                data-testid="import-json-paste-button"
              >
                Preview pasted JSON
              </Button>
            </div>
          </div>

          {preview ? (
            <Alert
              variant="muted"
              className="mt-5"
              data-testid="import-preview"
            >
              <AlertTitle>Import preview</AlertTitle>
              <AlertDescription>
                {preview.itemCount} items, {preview.completionCount} completed
                days, {preview.preferenceCount} preferences. Importing replaces
                current local data.
              </AlertDescription>
              {preview.warnings.length > 0 ? (
                <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
                  {preview.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={confirmImport}
                  data-testid="import-replace-button"
                >
                  Replace Data
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelImport}
                  data-testid="import-cancel-button"
                >
                  Cancel
                </Button>
              </div>
            </Alert>
          ) : null}

          {importError ? (
            <Alert
              variant="destructive"
              className="mt-4"
              data-testid="import-error"
            >
              <AlertDescription className="mt-0">
                {importError}
              </AlertDescription>
            </Alert>
          ) : null}
          <p
            role="status"
            aria-live="polite"
            className="mt-4 flex min-h-5 items-center gap-2 text-sm text-muted-foreground"
          >
            {message ? <Moon className="h-4 w-4" aria-hidden="true" /> : null}
            {message ?? ""}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
