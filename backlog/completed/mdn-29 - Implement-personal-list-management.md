---
id: MDN-29
title: Implement personal list management
status: Done
assignee: []
created_date: '2026-06-01 18:13'
updated_date: '2026-06-06 20:54'
labels:
  - media-lists
dependencies:
  - MDN-12
modified_files:
  - src/lib/actions/list.ts
  - src/lib/toast.ts
  - src/components/ui/toaster.tsx
  - src/components/list-sheet.tsx
  - src/components/new-list-button.tsx
  - src/app/(app)/page.tsx
  - 'src/app/(app)/lists/[id]/page.tsx'
  - 'src/app/(app)/lists/[id]/list-detail.tsx'
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the personal list management UX designed in MDN-12: the `/lists/[id]` page, list create/edit/delete, visibility settings, and item removal.

## Context

Design and decisions are in MDN-12. Key points:
- Single shared `/lists/[id]` shell; this task builds the base (personal) shell. Collaborative affordances (voting, attribution, ranked sort, member-scoped removal) are layered later by MDN-16 via extension points.
- List creation lives in a slide-over `Sheet` opened from home dashboard Widget 3's "New list" button (consistent with the add-to-list Sheet from MDN-13).
- Default Wishlist: name and existence locked; visibility editable (defaults private); no delete affordance.
- Item removal is optimistic with an undo toast; list deletion uses a destructive-confirm dialog.

## Implied server actions (gaps in `src/lib/actions/list.ts`)

- `createList(name, visibility)` — create with no initial item.
- `updateList(id, { name?, visibility })` — guard: reject name changes when isDefaultWishlist.
- `deleteList(id)` — reject when isDefaultWishlist.
- `removeListItem(listItemId)` — owner-scoped for now.

The `/lists/[id]` route does not exist yet (Widget 3 cards already link to it).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Widget 3 'New list' button opens a create Sheet with name (required) + visibility (default Private), and the new card appears on success
- [x] #2 /lists/[id] renders header (name, visibility badge, item count) and item rows (title/type/year/creator)
- [x] #3 Each item row has a Remove action (optimistic + undo toast), a 'Log it' shortcut, and an enthusiasm score picker (0–4, optional)
- [x] #4 Personal list items sort by enthusiasm score descending by default (unscored items treated as neutral)
- [x] #5 Owner-only Edit opens a pre-filled Sheet; saving updates name + visibility
- [x] #6 Default Wishlist edit Sheet shows visibility only (no name field) and exposes no Delete affordance; visibility is changeable
- [x] #7 Regular lists can be deleted via a destructive-confirm dialog and navigate back to the dashboard
- [x] #8 Empty-list state shows a prompt + CTA to catalog search
- [x] #9 Server actions createList, updateList, deleteList, removeListItem exist with Wishlist guards enforced server-side
- [x] #10 Server action setListItemScore(listItemId, score) persists the enthusiasm score for a list item
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented full personal list management:

**New server actions** in `src/lib/actions/list.ts`: `createList`, `updateList`, `deleteList`, `removeListItem`, `setListItemScore` — all with auth guards, Zod validation, ownership checks, and Wishlist guards server-side.

**Toast infrastructure** extended: `src/lib/toast.ts` kept simple, `src/components/ui/toaster.tsx` now renders `actionProps` button (enables undo pattern).

**`src/components/list-sheet.tsx`**: create/edit Sheet with name + Private/Public visibility. Reused for both create and edit flows. Edit mode for Wishlist hides name field.

**`src/components/new-list-button.tsx`**: client wrapper with open state; navigates to `/lists/[id]` on success.

**`src/app/(app)/page.tsx`**: Widget 3 header now includes `<NewListButton />`.

**`src/app/(app)/lists/[id]/page.tsx`**: server component, fetches list + items + user scores, owner-only.

**`src/app/(app)/lists/[id]/list-detail.tsx`**: full interactive client component — header with edit/delete, item rows with score picker (0–4), Log it link, optimistic remove + undo toast (deferred 5s server call), destructive confirm dialog for delete, empty state with search CTA. Sort: score desc (unscored treated as neutral 2).
<!-- SECTION:FINAL_SUMMARY:END -->
