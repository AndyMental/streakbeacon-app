"use client";

import { AlertCircle, CheckCircle2, ClipboardPaste, Download, FileJson, Info, Loader2, Monitor, Moon, RotateCcw, Sun, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  confirmResetAllData,
  dispatchStreakDataReset
} from "@/lib/streaks/reset";
import {
  createExportEnvelope,
  type ThemePreference
} from "@/lib/streaks/model";
import {
  STREAK_DATA_CHANGED_EVENT,
  validateImportText,
  type ImportPreview
} from "@/lib/streaks/storage";
import { useStreakData } from "@/lib/streaks/use-streak-data";

const STORAGE_ERROR_MESSAGE =
  "Browser storage is unavailable. Settings and import changes cannot be saved right now.";

export function SettingsPanel() {
  const importInputRef = useRef<HTMLInputElement>(null);
  const { setTheme, resolvedTheme } = useTheme();
  const { data, setData, isReady, storageError, store } = useStreakData();
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [isPasteOpen, setIsPasteOpen] = useState(false);

  useEffect(() => {
    setTheme(data.preferences.theme);
  }, [data.preferences.theme, setTheme]);

  function updateTheme(theme: ThemePreference) {
    if (!store) {
      return;
    }

    try {
      const next = store.updatePreferences({ theme });
      setData(next);
      setMessage("Theme preference saved.");
    } catch {
      // Error handled by hook's storageError if persistent
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

    setIsImporting(true);
    setImportError(null);
    setMessage(null);

    try {
      const text = await file.text();
      processImportText(text);
    } catch {
      setImportError("Failed to read the selected file.");
    } finally {
      setIsImporting(false);
    }
  }

  function handlePasteImport() {
    processImportText(pasteValue);
    setPasteValue("");
    setIsPasteOpen(false);
  }

  function processImportText(text: string) {
    const result = validateImportText(text);

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
      return;
    }

    try {
      const next = store.replaceData(preview.data);
      setData(next);
      setPreview(null);
      setMessage("Import complete. Local data was replaced.");
      window.dispatchEvent(new Event(STREAK_DATA_CHANGED_EVENT));
    } catch {
      // Error handled by hook
    }

    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
  }

  function cancelImport() {
    setPreview(null);
    setImportError(null);
    setMessage("Import cancelled.");

    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
  }

  function resetLocalData() {
    if (!store) {
      return;
    }

    try {
      const next = confirmResetAllData(store);
      setData(next);
      setTheme(next.preferences.theme);
      setPreview(null);
      setImportError(null);
      setMessage("Local data cleared.");
      dispatchStreakDataReset(window);
    } catch {
      // Error handled by hook
    }
  }

  const StatusIcon = resolvedTheme === "dark" ? Moon : Sun;
  const isActionDisabled = !isReady || Boolean(storageError) || isImporting;

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <StatusIcon className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent>
          {storageError ? (
            <Alert variant="destructive" className="relative mb-4 pl-10">
              <AlertCircle className="absolute left-4 top-4 h-4 w-4" />
              <AlertTitle>Storage unavailable</AlertTitle>
              <AlertDescription>{STORAGE_ERROR_MESSAGE}</AlertDescription>
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
            disabled={isActionDisabled}
            className="justify-start"
          >
            {(["system", "light", "dark"] as const).map((theme) => (
              <ToggleGroupItem
                key={theme}
                value={theme}
                aria-label={`${theme} theme`}
                data-testid={`settings-theme-${theme}`}
                className="gap-2"
              >
                {theme === "light" && <Sun className="h-4 w-4" aria-hidden="true" />}
                {theme === "dark" && <Moon className="h-4 w-4" aria-hidden="true" />}
                {theme === "system" && <Monitor className="h-4 w-4" aria-hidden="true" />}
                <span className="capitalize">{theme}</span>
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
            <Alert variant="destructive" className="relative mb-5 pl-10">
              <AlertCircle className="absolute left-4 top-4 h-4 w-4" />
              <AlertTitle>Storage unavailable</AlertTitle>
              <AlertDescription>{STORAGE_ERROR_MESSAGE}</AlertDescription>
            </Alert>
          ) : null}

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <Card className="bg-muted">
              <CardContent className="p-3">
                <dt className="truncate text-muted-foreground">Items</dt>
                <dd className="mt-1 truncate text-xl font-semibold">
                  {data.items.length}
                </dd>
              </CardContent>
            </Card>
            <Card className="bg-muted">
              <CardContent className="p-3">
                <dt className="truncate text-muted-foreground">Days</dt>
                <dd className="mt-1 truncate text-xl font-semibold">
                  {Object.values(data.completions).reduce(
                    (total, itemDays) => total + Object.keys(itemDays).length,
                    0
                  )}
                </dd>
              </CardContent>
            </Card>
            <Card className="bg-muted">
              <CardContent className="p-3">
                <dt className="truncate text-muted-foreground">Window</dt>
                <dd className="mt-1 truncate text-xl font-semibold">
                  {data.preferences.gridWindowDays}
                </dd>
              </CardContent>
            </Card>
          </dl>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              size="lg"
              onClick={exportData}
              disabled={isActionDisabled}
              data-testid="settings-export-json"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export JSON
            </Button>
            <Button asChild variant="outline" size="lg" disabled={isActionDisabled}>
              <Label className={cn("cursor-pointer", isActionDisabled && "opacity-50 pointer-events-none")}>
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="h-4 w-4" aria-hidden="true" />
                )}
                {isImporting ? "Reading file..." : "Import JSON"}
                <Input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  disabled={isActionDisabled}
                  onChange={(event) =>
                    handleImportFile(event.target.files?.[0])
                  }
                  data-testid="settings-import-json"
                />
              </Label>
            </Button>
            <AlertDialog open={isPasteOpen} onOpenChange={setIsPasteOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={isActionDisabled}
                  data-testid="settings-import-paste"
                >
                  <ClipboardPaste className="h-4 w-4" aria-hidden="true" />
                  Paste JSON
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Paste export JSON</AlertDialogTitle>
                  <AlertDialogDescription>
                    Paste the content of a StreakBeacon export file below to preview the import.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder='{"format": "streakbeacon.export", ...}'
                    className="min-h-32 font-mono text-xs"
                    value={pasteValue}
                    onChange={(e) => setPasteValue(e.target.value)}
                    data-testid="settings-import-paste-textarea"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handlePasteImport}
                    disabled={!pasteValue.trim()}
                    data-testid="settings-import-paste-confirm"
                  >
                    Preview Import
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="text-destructive hover:bg-destructive/10"
                  disabled={isActionDisabled}
                  data-testid="settings-reset-data"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reset all data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all local data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This clears every saved habit, completion, and preference
                    from this browser. Export first if you need a backup.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:opacity-90"
                    onClick={resetLocalData}
                  >
                    Confirm reset all data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {preview ? (
            <Alert variant="muted" role="status" className="relative mt-5 pl-10">
              <Info className="absolute left-4 top-4 h-4 w-4 text-primary" />
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
                  data-testid="settings-import-confirm"
                >
                  Replace Data
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelImport}
                  data-testid="settings-import-cancel"
                >
                  Cancel
                </Button>
              </div>
            </Alert>
          ) : null}

          {importError ? (
            <Alert variant="destructive" className="relative mt-4 pl-10">
              <AlertCircle className="absolute left-4 top-4 h-4 w-4" />
              <AlertTitle>Import Error</AlertTitle>
              <AlertDescription className="mt-0">
                {importError}
              </AlertDescription>
            </Alert>
          ) : null}
          <p
            role="status"
            aria-live="polite"
            className="mt-4 flex min-h-5 items-center gap-2 text-sm text-muted-foreground font-medium"
          >
            {message ? <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> : null}
            {message ?? ""}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
