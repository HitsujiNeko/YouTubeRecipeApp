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

## Structure

- `app/`: App Router pages and APIs
- `lib/`: shared modules (env, Supabase)
- `tests/e2e/`: Playwright E2E tests

## Current baseline

- Health endpoint: `GET /api/health`
- PWA manifest: `app/manifest.ts`
- Security headers: `middleware.ts`
