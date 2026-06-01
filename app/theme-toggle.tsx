"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  applyThemePreference,
  readThemePreference,
} from "@/lib/streaks/theme-preference";
import type { ThemePreference } from "@/lib/streaks/model";

const OPTIONS: ReadonlyArray<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "system", label: "System theme", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      try {
        const persisted = readThemePreference(window.localStorage);
        setTheme(persisted);
      } catch {
        // Storage may be denied; provider keeps its current selection.
      }

      setMounted(true);
    });

    return () => {
      cancelled = true;
    };
  }, [setTheme]);

  function handleValueChange(next: string) {
    if (next !== "light" && next !== "dark" && next !== "system") {
      return;
    }

    setTheme(next);

    try {
      applyThemePreference(window.localStorage, next);
    } catch {
      // Persistence may be denied; theme still applies for the session.
    }
  }

  const value: ThemePreference = mounted ? normalizeTheme(theme) : "system";

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={handleValueChange}
      aria-label="Theme"
      data-testid="theme-toggle"
      className="h-11 self-start sm:h-9 sm:self-auto"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;

        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={option.label}
            data-testid={`theme-toggle-${option.value}`}
            className="min-h-11 px-3 sm:min-h-9"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{option.label}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

function normalizeTheme(value: string | undefined): ThemePreference {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}
