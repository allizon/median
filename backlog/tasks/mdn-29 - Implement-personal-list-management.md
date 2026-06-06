---
id: MDN-29
title: Implement personal list management
status: To Do
assignee: []
created_date: '2026-06-01 18:13'
labels:
  - media-lists
dependencies:
  - MDN-12
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
- [ ] #1 Widget 3 'New list' button opens a create Sheet with name (required) + visibility (default Private), and the new card appears on success
- [ ] #2 /lists/[id] renders header (name, visibility badge, item count) and item rows (title/type/year/creator)
- [ ] #3 Each item row has a Remove action (optimistic + undo toast), a 'Log it' shortcut, and an enthusiasm score picker (0–4, optional)
- [ ] #4 Personal list items sort by enthusiasm score descending by default (unscored items treated as neutral)
- [ ] #5 Owner-only Edit opens a pre-filled Sheet; saving updates name + visibility
- [ ] #6 Default Wishlist edit Sheet shows visibility only (no name field) and exposes no Delete affordance; visibility is changeable
- [ ] #7 Regular lists can be deleted via a destructive-confirm dialog and navigate back to the dashboard
- [ ] #8 Empty-list state shows a prompt + CTA to catalog search
- [ ] #9 Server actions createList, updateList, deleteList, removeListItem exist with Wishlist guards enforced server-side
- [ ] #10 Server action setListItemScore(listItemId, score) persists the enthusiasm score for a list item
<!-- AC:END -->
