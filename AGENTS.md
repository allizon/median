# Median — Agents

## Quick start

```sh
pnpm install              # postinstall runs prisma generate automatically
pnpm dev                  # next dev
pnpm build                # prisma generate && next build
pnpm lint                 # eslint (flat config)
pnpm test                 # vitest run
pnpm test:watch           # vitest
pnpm seed                 # tsx prisma/seed.ts — requires DATABASE_URL
```

## Required env vars (`.env.local`)

```
DATABASE_URL=postgresql://...
AUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
TMDB_API_KEY=<TMDB v4 Bearer token, NOT v3 API key>
```

## Architecture

- **Framework**: Next.js 16 + React 19, App Router, full-stack (no separate backend). Tailwind CSS v4.
- **Package manager**: pnpm 11.5.2, Node 22.
- **Auth**: Auth.js v5 with **JWT strategy** (`session: { strategy: "jwt" }`). Credentials provider (username + password). `auth()`, `signIn`, `signOut` from `@/auth`. **Note**: CONTEXT.md claims server-side sessions — this is outdated; the code uses JWT.
- **Middleware proxy**: `src/proxy.ts` — auth `matcher` catches all non-static routes. Redirects unauthenticated users to `/login`, authenticated users off `/login` and `/signup`.
- **Session validity**: A session is valid only when it has both `user.id` and `user.username` (`isValidSession` in `src/lib/auth-routing.ts`). Missing username means a stale token.
- **Route groups**: `(app)/` = authenticated pages, `(public)/` = unauthenticated-accessible. Rewrite: `/@:username` → `/profile/:username`.
- **DB**: PostgreSQL (Neon), Prisma ORM v7, adapter-pg. Migrations in `prisma/migrations/`. `prisma generate` is required before `next build`.
- **UI**: `@base-ui/react` primitives, CVA variants, `cn()` from `clsx` + `tailwind-merge`. **Not shadcn** despite `components.json` existing.
- **Fonts**: Outfit (sans), Merriweather (serif), Fira Code (mono) via CSS variables.

## Conventions

- **Server actions** (`src/lib/actions/`): auth check first, Zod validation, ownership in Prisma `where`, return `{ status: "..." }` tagged union (never throw), `revalidatePath()` after writes.
- **Server/client split**: `page.tsx` = `async` server component (calls `auth()`, queries Prisma). Interactive children = `"use client"` files.
- **Wishlist → Watchlist alias**: Code uses "Wishlist" everywhere; UI shows "Watchlist". Use `listDisplayName()` / `WISHLIST_LABEL` from `src/lib/labels.ts` to alias at display time.
- **Media types**: Only `movie` and `tv_show` in UI. `book` enum exists in schema but must not appear in search filters, forms, or type labels.
- **Visibility**: `private` / `public` only in UI. `friends` enum value deferred.
- **Deferred delete**: Optimistic removal with 5s undo via `UNDO_DELAY_MS`. Toast via `toastManager` singleton (`src/lib/toast.ts`).
- **TMDB**: Server-side only (`TMDB_API_KEY` Bearer token, never `NEXT_PUBLIC_`). `searchTmdb()` and `fetchTmdbDetails()` in `src/lib/tmdb.ts`. Poster images from `image.tmdb.org`.

## Testing

- Vitest v4, jsdom, globals enabled. Test files in `tests/` matching `**/*.test.{ts,tsx}`. Setup in `tests/setup.ts`.
- Path alias `@/` → `./src/` works in tests.
- No CI pipeline exists (no `.github/`).

## Key gotchas

- **build** does `prisma generate && next build`. If you run `next build` directly without `prisma generate` first, it fails.
- **postinstall** runs `prisma generate` — but only on `pnpm install`, not on `pnpm add <pkg>`.
- `prisma.config.ts` loads `.env.local` via `dotenv` at import time.
- Vitest config uses `environment: 'jsdom'`, not `happy-dom`. Tests run in Node, not a browser.
- The `(app)` layout has its own session-validity guard that agrees with the middleware proxy on what counts as "logged in".

## Instruction files

- `CLAUDE.md` — comprehensive conventions (server actions, toast, UI primitives, wishlist alias). Most detailed instruction source.
- `CONTEXT.md` — domain language reference.
- `docs/adr/` — 6 ADRs covering key decisions.
- `opencode.json` — minimal (permissions only).
- `.opencode/memory.md` — persistent session memory (branching policy, preferences, past work).

## Git workflow

- **Code changes** (`.ts`, `.tsx`, `.js`, `.css`, configs, etc.) → create a feature branch, push branch, open PR to `main`. Never push code directly to `main`.
- **Documentation / markdown only** → can push directly to `main`.
- Check `.opencode/memory.md` for additional session context and preferences.
