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
- Preview/preflight gate: `npm run preview:preflight` (runs `npm run lint && npm run test && npm run build` in that order; the same script is invoked by the `Preview Preflight` GitHub Actions workflow on every pull request and push)

## OpenAPI

The repository uses a custom Ajv-based harness for OpenAPI contract validation.

- Run contract tests: `npm run test:contract`

Before adding frontend code or black-box tests that consume API routes, add or
identify the OpenAPI/Swagger workflow and document the exact command here.
If adding new API routes, ensure they are documented in `docs/openapi.yaml` and
that the contract tests pass.

## Deployment

The app must remain deployable on Vercel. The project is configured via
`vercel.json`. No committed `.vercel/` directory and no tracked `.env*`
template is present in the repo root yet.

### Current pre-deploy local checks

Agents must run these against the working tree before any deploy handoff and
report exact pass/fail:

```bash
npm install
npm run preview:preflight
```

`npm run preview:preflight` runs `npm run lint && npm run test && npm run
build` in the same order as the `Preview Preflight` GitHub Actions workflow
(`.github/workflows/preview-preflight.yml`), so passing it locally matches
the deploy-adjacent CI gate.

### Deploy blocker — admin input required

A deploy URL cannot be produced from this repo alone. To unblock, a human
admin with Vercel access must:

1. Configure required environment variables in the Vercel project settings
   and add a redacted `.env.example` to the repo root if any are needed at
   build time.
2. Provide the resulting Vercel production URL on the parent deployment
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
