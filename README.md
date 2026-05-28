# StreakBeacon

StreakBeacon is a Vercel-deployable Next.js App Router app for local-first
streak tracking.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
npm run preview:preflight
```

## Preview readiness

Use Node.js 20.9.0 or newer. The preview preflight command runs lint, unit
tests, and the production build in the same order as the GitHub Actions
workflow.

Vercel should use the Next.js framework preset with the repo defaults:

- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: Next.js default `.next`
- Required secrets: none for the current local-first app
