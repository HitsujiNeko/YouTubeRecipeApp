# YouTube Recipe Card Web

Next.js (App Router, TypeScript) based web app for the YouTube Recipe Card MVP.

## Setup

1. Install dependencies

```bash
npm install
```

2. Create environment file

```bash
cp .env.example .env.local
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_DATA_API_KEY`
- `LLM_PROVIDER` (`gemini` or `openai`, default: `gemini`)
- `GEMINI_API_KEY` (required when `LLM_PROVIDER=gemini`)
- `OPENAI_API_KEY` (required when `LLM_PROVIDER=openai`)
- `LLM_GEMINI_MODEL` (optional, default: `gemini-2.0-flash-lite`)
- `LLM_OPENAI_MODEL` (optional, default: `gpt-4o-mini`)

3. Run development server

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Scripts

- `npm run dev`: start local dev server
- `npm run build`: production build
- `npm run start`: run production server
- `npm run lint`: run ESLint
- `npm run typecheck`: run TypeScript checks
- `npm run format`: format files with Prettier
- `npm run format:check`: verify formatting
- `npm run test:e2e`: run Playwright tests
- `npm run verify:prepr`: run auto checks and generate a manual QA checklist file
- `npm run db:migration:new -- <name>`: create a new Supabase migration file
- `npm run db:push`: apply `supabase/migrations` to linked project
- `npm run db:reset:local`: reset local Supabase DB and replay migrations

## Pre-PR Verification

Before creating a PR, run:

```bash
npm run verify:prepr
```

This command does two things:

1. Runs automated checks (`format:check`, `lint`, `typecheck`, `test:unit`)
2. Generates a manual QA template in `test-results/manual-qa/`

Use the generated checklist for visual/manual validation and attach screenshots in PR.

## DB Migration (Supabase CLI)

This project uses `apps/web/supabase/migrations` as the single source of truth for schema diffs.

1. Run via `npx` (no global install required)

```bash
npx supabase --version
```

2. Link your project once

```bash
cd apps/web
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

3. Create a migration

```bash
npm run db:migration:new -- add_some_column
```

4. Edit the generated SQL in `supabase/migrations/*`

5. Apply migration

```bash
npm run db:push
```

Current applied migration for Q-013:

- `supabase/migrations/202603090001_q013_add_extraction_columns.sql`

## Structure

- `app/`: App Router pages and APIs
- `lib/`: shared modules (env, Supabase)
- `tests/e2e/`: Playwright E2E tests

## Current baseline

- Health endpoint: `GET /api/health`
- PWA manifest: `app/manifest.ts`
- Security headers: `middleware.ts`
