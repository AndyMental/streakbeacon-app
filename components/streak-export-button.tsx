"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { StreakGridModel } from "@/lib/streaks/grid";
import { useTheme } from "next-themes";

interface StreakExportButtonProps {
  model: StreakGridModel;
  disabled?: boolean;
}

export function StreakExportButton({ model, disabled }: StreakExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { resolvedTheme } = useTheme();

  const handleExport = async () => {
    if (!model.activeItem) return;

    setIsExporting(true);
    try {
      const isDark = resolvedTheme === "dark";
      const colors = {
        background: isDark ? "#0f172a" : "#f8fafc",
        foreground: isDark ? "#f8fafc" : "#111827",
        mutedForeground: isDark ? "#cbd5e1" : "#475569",
        streakEmpty: isDark ? "#1f2937" : "#f1f5f9",
        streakEmptyBorder: isDark ? "#334155" : "#dbe3ea",
        streak1: isDark ? "#164b2b" : "#b7ebcb",
        streak2: isDark ? "#1b6b3a" : "#73d99a",
        streak3: "#27ae60",
        streak4: isDark ? "#2d9cdb" : "#1f8f4d",
      };

      const cellSize = 20;
      const cellGap = 4;
      const padding = 40;
      const headerHeight = 100;

      const numWeeks = model.weeks.length;
      const numDaysInWeek = 7;

      const canvasWidth = padding * 2 + numWeeks * (cellSize + cellGap) - cellGap;
      const canvasHeight = padding * 2 + headerHeight + numDaysInWeek * (cellSize + cellGap) - cellGap;

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth * 2; // High DPI
      canvas.height = canvasHeight * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.scale(2, 2);

      // Background
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Header - Habit Name
      ctx.fillStyle = colors.foreground;
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(model.activeItem.name, padding, padding + 30);

      // Header - Stats
      ctx.font = "16px sans-serif";
      ctx.fillStyle = colors.mutedForeground;
      ctx.fillText(
        `Current: ${model.currentStreak} days  |  Longest: ${model.longestStreak} days`,
        padding,
        padding + 60
      );

      // Header - Range (approximate)
      if (model.weeks.length > 0) {
        const firstWeek = model.weeks[0];
        const lastWeek = model.weeks[model.weeks.length - 1];
        const firstDay = firstWeek.days[0].label;
        const lastDay = lastWeek.days[lastWeek.days.length - 1].label;
        ctx.font = "12px sans-serif";
        ctx.fillText(`${firstDay} - ${lastDay}`, padding, padding + 85);
      }

      // Grid
      model.weeks.forEach((week, weekIndex) => {
        week.days.forEach((day, dayIndex) => {
          const x = padding + weekIndex * (cellSize + cellGap);
          const y = padding + headerHeight + dayIndex * (cellSize + cellGap);

          const intensityColors = [
            colors.streakEmpty,
            colors.streak1,
            colors.streak2,
            colors.streak3,
            colors.streak4,
          ];
          const intensityColor = intensityColors[day.intensity];
          const borderColor = day.intensity === 0 ? colors.streakEmptyBorder : intensityColor;

          ctx.fillStyle = intensityColor;
          // draw rounded rect
          const r = 4;
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + cellSize - r, y);
          ctx.quadraticCurveTo(x + cellSize, y, x + cellSize, y + r);
          ctx.lineTo(x + cellSize, y + cellSize - r);
          ctx.quadraticCurveTo(x + cellSize, y + cellSize, x + cellSize - r, y + cellSize);
          ctx.lineTo(x + r, y + cellSize);
          ctx.quadraticCurveTo(x, y + cellSize, x, y + cellSize - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      });

      // Download
      const link = document.createElement("a");
      const safeName = model.activeItem.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const filename = `${safeName}-streak-${new Date().toISOString().slice(0, 10)}.png`;
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("Grid exported as PNG", {
        description: `Saved as ${filename}`
      });
    } catch (error) {
      console.error("Export failed", error);
      toast.error("Failed to export PNG");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="sm:min-h-9 sm:px-3 sm:text-xs"
      data-testid="dashboard-export-button"
      onClick={handleExport}
      disabled={disabled || isExporting || !model.activeItem}
    >
      <Download className="h-4 w-4 mr-2" aria-hidden="true" />
      {isExporting ? "Exporting..." : "Export"}
    </Button>
  );
}
