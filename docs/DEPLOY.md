# Deploy Handoff

StreakBeacon is a Next.js App Router app intended for Vercel deployment from
`AndyMental/streakbeacon-app`.

## Vercel Project Settings

Use the Vercel Next.js framework preset with the repo defaults already
documented in `README.md`.

- Repository: `AndyMental/streakbeacon-app`
- Source branch: default branch unless a release issue names a specific branch
- Node.js version: `>=20.9.0`
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: Next.js default `.next`
- Required secrets: none for the current local-first app

The repo includes `vercel.json` for Vercel framework detection and shared
security headers. No committed `.vercel/` directory or tracked root `.env*`
template exists in this repo at the time of this handoff. Do not invent Vercel
project IDs, tokens, environment variables, or deployment URLs.

## Pre-Deploy Checks

Run the repo-documented checks before handing off a deploy branch:

```bash
npm install
npm run preview:preflight
```

The convenience script `npm run preview:preflight` runs format check, lint,
unit tests, and the production build in the same order as the GitHub Actions
workflow.

## Admin Handoff

A deploy URL cannot be produced from this repo alone until a human admin with
Vercel access links or creates the Vercel project for this repository.

The admin should confirm:

- The Vercel project is linked to `AndyMental/streakbeacon-app`.
- The source branch is the repo default branch unless the release issue says
  otherwise.
- The install, build, output, and Node settings match this document.
- No required secrets are needed for the current local-first app, or a redacted
  `.env.example` is added if build-time secrets become required.
- The stable Vercel URL is recorded on the deployment issue.

## Issue Metadata After First Deploy

After the first stable Vercel deployment exists, pin only durable issue metadata
that future agents will re-read:

- `deploy_url`: the stable Vercel URL.
- `pipeline_status`: the current deploy or CI state.
- `deploy_source`: the repository and branch used for the deployment.
- `required_secrets`: confirmation that no secrets are required, or the redacted
  names of required settings.

Also remove stale blocker metadata once the deploy is no longer blocked:

- Clear `waiting_on` if it only referred to the missing Vercel project/admin
  setup.
- Clear `blocked_reason` if the deployment issue is no longer blocked.
