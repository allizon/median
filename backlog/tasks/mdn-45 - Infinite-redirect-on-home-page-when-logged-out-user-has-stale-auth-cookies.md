---
id: MDN-45
title: Infinite redirect on home page when logged-out user has stale auth cookies
status: To Do
assignee: []
created_date: '2026-06-12 13:34'
labels:
  - bug
  - auth
dependencies: []
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
