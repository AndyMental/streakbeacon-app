# StreakBeacon App Agent Guide

## Stack Detection

The repository currently has no application files committed. No `package.json`,
`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `next.config.*`,
`tsconfig.json`, `pom.xml`, `build.gradle`, `requirements.txt`,
`pyproject.toml`, or `Gemfile` is present at the repo root.

Expected direction for this project is a Vercel-deployable Next.js app using the
App Router, but agents must re-check the repo before implementation work and
follow the commands that are actually present.

## Repo Commands

No repo-local install, build, lint, test, or run commands are available yet
because the app scaffold has not been committed.

When a Next.js scaffold is added, update this file with the exact commands from
the committed package manager and scripts. Do not guess or mix package managers.

## OpenAPI

No OpenAPI or Swagger generation/update command is present yet.

Before adding frontend code or black-box tests that consume API routes, add or
identify the OpenAPI/Swagger workflow and document the exact command here.

## Deployment

The app must remain deployable on Vercel. No repo-local deployment command or
Vercel project configuration is present yet.

When deployment configuration exists, document the exact Vercel path and any
required verification steps here. Playwright tests in `streakbeacon-tests` should
run only against the deployed Vercel URL.

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
