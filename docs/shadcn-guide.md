# shadcn/ui Maintenance Guide

StreakBeacon uses shadcn/ui primitives as the base for interactive UI. Keep
application behavior in App Router feature files and compose UI from the
existing primitives in `components/ui`.

## Current Setup

- `components.json` is the source for shadcn configuration: `new-york` style,
  React Server Components enabled, TypeScript, CSS variables, and the
  `@/components/ui` alias.
- Shared primitives live in `components/ui`. Feature-specific composition lives
  beside the consuming surface, such as `app/streak-dashboard.tsx`,
  `app/settings-panel.tsx`, `components/weekly-overview.tsx`, and
  `components/streak-export-button.tsx`.
- Shared class merging goes through `cn` from `@/lib/utils`.
- Icons come from `lucide-react`, matching the `iconLibrary` configured in
  `components.json`.

## Primitive Usage

- Reuse existing primitives before adding anything new. Current primitives cover
  alerts, alert dialogs, badges, buttons, cards, inputs, labels, skeletons,
  textareas, toggle groups, tooltips, and the toaster.
- Add a new shadcn primitive only when the current set does not fit the
  interaction. Keep the generated file under `components/ui` and preserve the
  local import aliases.
- Do not create a separate component system or parallel primitive folder.
  Feature components should wrap domain behavior around shadcn primitives
  instead of replacing them.
- Use `Button` variants and sizes for actions. Use `asChild` for semantic hosts
  such as file-input labels when the existing primitive already supports the
  interaction.
- Use Radix-backed primitives for stateful interactions already represented in
  the repo: `AlertDialog` for destructive or confirm flows, `ToggleGroup` for
  exclusive mode selection, and `Tooltip` for grid/overview hover details.

## Tailwind and Tokens

- Prefer semantic Tailwind tokens backed by `app/globals.css`: `bg-background`,
  `text-foreground`, `bg-card`, `text-card-foreground`, `border`,
  `text-muted-foreground`, `bg-primary`, `text-primary-foreground`,
  `text-destructive`, and streak tokens such as `bg-streak-3`.
- Keep StreakBeacon brand colors centralized in CSS variables:
  `--beacon`, `--sky`, and the `--streak-*` scale. Do not duplicate those
  hex values in component classes.
- Use `cn` for conditional class names so Tailwind conflicts are merged
  consistently.
- Preserve stable responsive layouts with explicit grid tracks, fixed control
  dimensions, `min-w-0`, `truncate`, and overflow wrappers where the current UI
  already uses them.

## Light and Dark Support

- Theme state is managed through `next-themes` in `app/theme-provider.tsx` and
  applied with the `.dark` class.
- Add or adjust colors in both `:root` and `.dark` inside `app/globals.css`
  when a new semantic token is needed.
- Keep interactive focus and ring colors token-based, using `ring-ring`,
  `focus-visible:ring-ring`, and related semantic classes.
- For canvas or exported assets that cannot read Tailwind variables directly,
  mirror the existing light/dark palette deliberately and keep it aligned with
  `app/globals.css`.

## Accessibility and States

- Keep shadcn/Radix labels, triggers, and dialog structure intact. Add
  `aria-label`, `aria-describedby`, `role="status"`, or `role="alert"` where
  the surrounding code uses them for non-visible state.
- Represent loading, empty, error, success, disabled, mobile, and desktop states
  explicitly when adding a surface.
- Pair icon-only controls with accessible labels or screen-reader text. When
  text is visible next to an icon, keep `aria-hidden="true"` on decorative
  icons.
- Keep local-first failure states visible. Storage errors should be surfaced
  through the existing alert pattern and should disable writes that cannot be
  persisted.

## Maintenance Checks

Follow the repo-root `AGENTS.md` for commands. For UI or docs changes, run the
documented checks that are feasible for the change and report exact pass/fail.
The full local gate is:

```bash
npm install
npm run preview:preflight
```