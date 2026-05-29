# StreakBeacon App Agent Guide

## Stack Detection

The repository is a Next.js App Router application using npm, TypeScript, and
Tailwind CSS.

Agents must re-check the repo before implementation work and follow the
commands that are actually present.

## Repo Commands

- Install dependencies: `npm install`
- Start local dev server: `npm run dev`
- Lint: `npm run lint`
- Test: `npm run test`
- Build: `npm run build`
- Start production server after a build: `npm run start`

## OpenAPI

The backend HTTP contract lives at `docs/openapi.yaml` (OpenAPI 3.1). It is
hand-maintained — there is no generation script yet.

Maintenance rule: when an `app/api/**/route.ts` handler is added, changed,
or removed, update `docs/openapi.yaml` in the same change so the spec and
the running handlers stay in sync. The contract currently advertises no
operations because StreakBeacon is local-first and no route handlers are
committed.

Before adding frontend code or black-box tests that consume API routes,
update `docs/openapi.yaml` first so the consumer has a contract to read.

## Deployment

The app must remain deployable on Vercel. No repo-local deployment command or
Vercel project configuration is present yet: there is no `vercel.json`, no
committed `.vercel/` directory, and no tracked `.env*` template in the repo
root.

### Current pre-deploy local checks

Agents must run these against the working tree before any deploy handoff and
report exact pass/fail:

```bash
npm install
npm run lint
npm run test
npm run build
```

### Deploy blocker — admin input required

A deploy URL cannot be produced from this repo alone. To unblock, a human
admin with Vercel access must:

1. Link a Vercel project to this repository (e.g. `vercel link`) and commit
   any resulting repo-tracked configuration (such as `vercel.json`) on a
   feature branch.
2. Configure required environment variables in the Vercel project settings
   and add a redacted `.env.example` to the repo root if any are needed at
   build time.
3. Provide the resulting Vercel production URL on the parent deployment
   issue so workers and Playwright runs can reference it.

Until that admin input lands and is recorded on the issue:

- Do not claim a deploy URL.
- Do not invent Vercel project IDs, tokens, or environment values.
- Do not run Playwright in `streakbeacon-tests` against a guessed host —
  the suite must target only the deployed Vercel URL once it exists.

When the configuration above is present, replace this section with the exact
deploy command and verification steps.

## Project Constraints

- Use Next.js App Router only.
- Implement server functionality with Next.js API route handlers only.
- Do not introduce a separate backend service.
- Keep the product local-first by default.
- Do not add a database, schema, or persistence architecture unless Jyro records
  that decision on the issue.
- Use shadcn/ui only for frontend component work.
- Keep work on feature branches. Never push directly to a default branch.
- Do not merge unless explicitly assigned and all required gates are green.
- Match surrounding code style and conventions once code exists.

## Agent Workflow Notes

- Start every task by reading the issue, metadata, full comment history, this
  file, and current git state.
- Detect the actual stack from committed files before choosing commands.
- Run or honestly report required checks before handoff.
- Record PR URLs, deploy URLs, CI status, and durable blockers on the issue when
  they clear the metadata bar.
