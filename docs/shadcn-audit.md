# Shadcn UI Compliance Audit - StreakBeacon

**Audit Date:** May 31, 2026
**Project:** StreakBeacon
**Goal:** Ensure 100% compliance with the "shadcn-only" UI component mandate.

## Summary
The StreakBeacon application largely adheres to shadcn/ui components for core interactions (buttons, inputs, cards, alerts). However, a few native HTML elements and custom Tailwind-styled containers were identified that should be migrated to shadcn primitives to maintain full compliance.

---

## 1. Critical Violations
*Native HTML elements used where a shadcn component exists.*

| File | Line | Violation | Recommendation |
| :--- | :--- | :--- | :--- |
| `app/streak-dashboard.tsx` | 350 | Raw `<button>` used for grid squares. | Replace with shadcn `Button`. Use a custom size variant (e.g., `size="square"`) or a small custom utility class if the standard `sm` is too large. |

---

## 2. High Priority
*Custom UI containers/patterns that should be replaced with shadcn components.*

| File | Line | Violation | Recommendation |
| :--- | :--- | :--- | :--- |
| `app/streak-dashboard.tsx` | 281 | `<form>` styled with `rounded-md border bg-muted/30 p-3`. | Wrap the form content in a shadcn `Card` or use a `CardContent` with custom background if the outer card isn't sufficient. |
| `app/page.tsx` | 66 | Habit list using `div` with `divide-y`. | Replace `divide-y` with the shadcn `Separator` component between items for more consistent spacing and style. |
| `app/page.tsx` | 22 | Header with custom `border-b pb-6`. | Consider if this should be a specialized navigation/header component or wrapped in a consistent container. |

---

## 3. Medium Priority
*Stylistic customization on shadcn components that could be standardized.*

| File | Line | Violation | Recommendation |
| :--- | :--- | :--- | :--- |
| `app/page.tsx` | 63 | `CardHeader` with custom `border-b py-3`. | Standardize whether Card headers should have borders across the app. Currently, it's inconsistent. |
| `app/streak-dashboard.tsx` | 219 | `CardHeader` with `border-b`. | (As above) Standardize header borders. |
| `app/not-found.tsx` | 14 | `CardHeader` with `border-b`. | (As above) Standardize header borders. |
| `app/global-error.tsx` | 29 | `CardHeader` with `border-b`. | (As above) Standardize header borders. |
| `app/streak-dashboard.tsx` | 376 | Legend using raw `span` with `border`. | Use shadcn `Badge` or a tiny `Button` variant to represent intensity squares in the legend for component consistency. |

---

## 4. Recommendations
1. **Standardize Card Headers:** Decide if a border under the title is a global design choice. If so, add it to the `CardHeader` component definition or create a shared variant.
2. **Componentize the Streak Grid:** The grid is currently a complex block of logic and custom HTML in `streak-dashboard.tsx`. Moving it to a dedicated component (e.g., `components/streak-grid.tsx`) using shadcn `Button` would improve maintainability and compliance.
3. **Install Missing Primitives:** Install `separator` from shadcn to replace native `divide-y` or horizontal rules.
4. **Custom Button Variants:** Add a `square` or `xs` variant to `components/ui/button.tsx` to handle the small grid squares without reverting to raw HTML.
