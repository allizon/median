---
id: MDN-47
title: >-
  "Add to Wishlist" should open a search-and-add modal instead of duplicating
  "Browse Catalog"
status: To Do
assignee: []
created_date: '2026-06-12 14:15'
labels:
  - dashboard
  - wishlist
  - ui
dependencies:
  - MDN-38.1
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On the dashboard (`src/app/(app)/page.tsx`), the "Add to Wishlist" CTA (~line 52-56) and "Browse catalog" CTA (~line 58-62) both currently just link to `/search` — they do the same thing. "Add to Wishlist" should instead open a centred modal (Letterboxd "Log +" style) for searching the catalog and adding directly to the wishlist, with a fallback to create a new media item if nothing matches.

## Dependency

Depends on MDN-38.1 (converting `AddToListSearchSheet` and `AddMediaSheet` to modals). This task reuses those modalized components: the wishlist is just the user's default list, so the modalized `AddToListSearchSheet` can be pointed at the wishlist's list ID, extended with an "add new media if nothing found" fallback that opens the modalized `AddMediaSheet`.

## Related context (not blocking)

- MDN-25 (design UX flow for adding a missing media item then adding to a list) explores this flow more broadly; this task implements a concrete version scoped to this dashboard CTA.
- MDN-43 (browse-first experience in Add Items) — reuse the same browse-first catalog search behaviour here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 "Add to Wishlist" button opens a centered modal instead of navigating to /search
- [ ] #2 Modal shows browse-first catalog search (reusing the modalized AddToListSearchSheet), with the same sort/filtering as Browse Catalog
- [ ] #3 Selecting a catalog item adds it directly to the user's wishlist (default list) without leaving the modal; items already on the wishlist are marked "Added" and non-interactive
- [ ] #4 If search returns no results, the modal offers "Add new", opening the modalized AddMediaSheet; on save, the new item is added to the wishlist and the modal closes
- [ ] #5 "Browse catalog" button is unchanged (still navigates to /search)
- [ ] #6 Wishlist/Up Next widget reflects the newly added item after the modal closes (e.g. via router.refresh())
<!-- AC:END -->
