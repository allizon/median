---
id: MDN-45
title: Infinite redirect on home page when logged-out user has stale auth cookies
status: Done
assignee: []
created_date: '2026-06-12 13:34'
updated_date: '2026-06-12 14:30'
labels:
  - bug
  - auth
dependencies: []
modified_files:
  - src/proxy.ts
  - src/app/(app)/layout.tsx
  - src/lib/auth-routing.ts
  - tests/auth-routing.test.ts
priority: high
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Problem
Visiting `/` (the home page, under the `(app)` route group) results in an infinite redirect loop when the requesting browser is not actually authenticated but still carries leftover auth cookies (e.g. a NextAuth session/JWT cookie from a previous login that is now invalid, expired, or references a deleted/orphaned user).

## Where to look
- `src/app/(app)/layout.tsx`: calls `auth()` and does `if (!session?.user?.id) redirect("/login")` and `if (!session.user.username) redirect("/login")` (orphaned session guard).
- `src/app/(app)/page.tsx`: assumes a valid session via `session!.user!.id!` non-null assertions — if `auth()` returns a session-shaped object with missing/invalid fields due to a malformed JWT cookie, this could throw or behave unexpectedly.
- `src/auth.ts`: NextAuth JWT/session callbacks — need to check whether a stale/invalid cookie causes `auth()` to throw or to return a session object that passes the `(app)/layout.tsx` checks but then fails downstream, bouncing the user back through `/login` -> `/` -> `/login` ...

## Repro steps
1. Log in, then manually invalidate the session server-side (e.g. delete the user row, or expire/corrupt the session JWT cookie) while keeping the auth cookie in the browser.
2. Navigate to `/` (home page).
3. Observe an infinite redirect loop instead of being sent cleanly to `/login`.

## Expected behavior
A user with invalid/stale auth cookies visiting `/` should be redirected to `/login` exactly once (and ideally have the stale cookie cleared), not loop indefinitely.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Root cause: `src/proxy.ts` defined `isLoggedIn = !!req.auth` (true for any truthy session), while `(app)/layout.tsx`'s orphaned-session guard required `session.user.id` AND `session.user.username`. A JWT cookie that decodes successfully but lacks the `username` claim satisfies proxy's check but fails the layout's check, causing `/` -> `/login` (layout) -> `/` (proxy, since isLoggedIn=true on an auth route) -> infinite loop.

Fix: extracted a single shared definition into `src/lib/auth-routing.ts` (`isValidSession` type guard + `getProxyRedirect`), and used it in both `src/proxy.ts` and `src/app/(app)/layout.tsx` so they agree on session validity.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced the loop locally by crafting a JWT with `next-auth/jwt`'s `encode()` containing `sub` but no `username` claim, setting it as the `authjs.session-token` cookie, and curling `/` with `-L` (50 redirects, bouncing between `/` and `/login`). After the fix, the same cookie produces a single 307 to `/login` and `/login` returns 200 without bouncing back.

Verified normal flows unaffected: logged-out -> / redirects once to /login; logged-out -> /login is 200; fully valid session -> /login redirects to /; fully valid session -> / is 200.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary
Fixed an infinite redirect loop on `/` for users with a stale/orphaned auth cookie (valid JWT signature, but missing the `username` claim).

## Root cause
`src/proxy.ts` and `src/app/(app)/layout.tsx` used two different definitions of "logged in":
- proxy: `isLoggedIn = !!req.auth` (any truthy session)
- layout: requires `session.user.id` AND `session.user.username` (orphaned session guard)

For a session missing `username`, proxy treated the user as logged in (redirecting `/login` -> `/`) while the layout treated them as logged out (redirecting `/` -> `/login`), producing an infinite ping-pong.

## Fix
- Added `src/lib/auth-routing.ts` exporting `isValidSession` (type guard requiring `user.id` + `user.username`) and `getProxyRedirect` (the routing decision built on top of it).
- `src/proxy.ts` now delegates its redirect decision to `getProxyRedirect`.
- `src/app/(app)/layout.tsx`'s session check now uses `isValidSession`, consolidating the two previous separate checks into one.

## Tests
- New `tests/auth-routing.test.ts` (5 cases: logged-out on protected/public routes, fully logged-in on auth/protected routes, and the orphaned-session case from this bug).
- `pnpm test` (7/7 pass) and `tsc --noEmit` clean.
- Manually reproduced the original loop and confirmed the fix against the running dev server via crafted JWT cookies (curl).
<!-- SECTION:FINAL_SUMMARY:END -->
