---
id: MDN-46
title: Add friendly welcome message to dashboard
status: To Do
assignee: []
created_date: '2026-06-12 14:15'
labels:
  - dashboard
  - ui
dependencies: []
ordinal: 71000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The dashboard (`src/app/(app)/page.tsx`) currently jumps straight into CTAs and widgets with no greeting. Add a friendly, personalized welcome message at the top of the page using the logged-in user's display name (falling back to username, matching the pattern in `src/auth.ts` line 39: `displayName ?? username`).

Reuse the existing dashboard text styling conventions (e.g. the muted-foreground empty-state text in `src/components/wishlist-widget.tsx` lines 66-75) for visual consistency.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dashboard shows a welcome message at the top of the page using the logged-in user's display name (or username if no display name is set)
- [ ] #2 Styling matches existing dashboard text conventions (e.g. muted-foreground/empty-state text patterns used in wishlist-widget.tsx)
- [ ] #3 Message renders correctly for users with and without a displayName set
- [ ] #4 No layout shift/regression to the CTA and widget sections below
<!-- AC:END -->
