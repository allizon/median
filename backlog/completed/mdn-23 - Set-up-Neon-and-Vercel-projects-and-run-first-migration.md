---
id: MDN-23
title: Set up Neon and Vercel projects and run first migration
status: Done
assignee: []
created_date: '2026-05-31 17:56'
updated_date: '2026-05-31 18:39'
labels:
  - infrastructure
  - setup
dependencies: []
priority: high
ordinal: 500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wire up the infrastructure for the Median app. The Next.js scaffold is complete and ready — this task connects it to real services.

## Steps

### 1. Create Neon project
- Go to neon.tech, create a new project called "median"
- From the dashboard → Connection Details, copy the **pooled** connection string (port 5432, includes `?sslmode=require`)
- Paste it into `.env.local` as `DATABASE_URL`

### 2. Run the first migration
```bash
pnpm exec prisma migrate dev --name init
```
This creates all tables from the schema. Requires a live `DATABASE_URL`.

### 3. Create Vercel project
- Go to vercel.com, create a new project linked to the median GitHub repo
- In Vercel project settings → Environment Variables, add:
  - `DATABASE_URL` — the Neon pooled connection string
  - `AUTH_SECRET` — generate with `openssl rand -base64 32`
  - `NEXTAUTH_URL` — the Vercel deployment URL (e.g. `https://median.vercel.app`)
- Trigger a deploy and verify it succeeds

### 4. Verify locally
```bash
pnpm dev
```
Visit http://localhost:3000 — middleware should redirect to `/login` (page doesn't exist yet, so 404 is expected). No 500 errors means the DB connection is working.

## Notes
- Prisma v7 requires the `@prisma/adapter-pg` driver adapter — already wired in `src/lib/prisma.ts`
- Use the Neon **pooled** connection string, not the direct one, and not a `prisma://` URL
- The first migration creates all 12 Median models plus Auth.js session/account tables
- Password reset is manual (no email in v1) — see ADR notes in CONTEXT.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Neon project exists with a median database
- [ ] #2 pnpm exec prisma migrate dev --name init completes without errors
- [ ] #3 All tables visible in Neon dashboard
- [ ] #4 Vercel project created and linked to the GitHub repo
- [ ] #5 DATABASE_URL, AUTH_SECRET, and NEXTAUTH_URL set in Vercel environment variables
- [ ] #6 Vercel deploy succeeds (green)
- [ ] #7 Local dev server starts without 500 errors when DATABASE_URL is set
<!-- AC:END -->
