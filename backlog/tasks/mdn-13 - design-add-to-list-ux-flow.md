---
id: MDN-13
title: Design add-to-list UX flow
status: Done
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31'
labels:
  - UX
  - media-lists
dependencies:
  - MDN-6
  - MDN-12
ordinal: 31000
---

## Description

Design the UX for adding media items to lists — both the one-tap "Add to Wishlist" shortcut and the "Add to list…" picker flow.

## Context

- Primary action: "Add to Wishlist" — one tap, adds directly to the default Wishlist (PRD 5.4, story 2).
- Secondary action: "Add to list…" — opens a picker to choose any list (PRD 5.4, story 3).
- Adding a duplicate to a list is a no-op (PRD 5.4).
- Story 6 (add media items to any list) subsumes this flow — the picker must show all user lists.
- This flow is also the entry point for the "Log it" shortcut on list items (covered by MDN-9).

## Decisions

| Question | Decision |
|---|---|
| Where do the actions appear? | Both search result rows and the media item page `/media/[id]` |
| List picker UI | Slide-over sheet (reuses the existing `Sheet` component) |
| Create list from picker? | Yes — inline "New list" row at the bottom of the picker |
| Feedback for "Add to Wishlist" | Toast notification (top-right) |
| Duplicate / already-in-wishlist state | "Add to Wishlist" button shows "In Wishlist" state, pre-loaded from server |
| Picker: info per row | List name + item count |
| Picker: item already in a list | Row greyed out / disabled with "Already added" label |
| Toast position | Top-right |

## Flow description

### "Add to Wishlist" button

- Appears on each search result row and on the `/media/[id]` page.
- Server-rendered with initial state: if the item is already in the user's default Wishlist, the button renders as "In Wishlist" (disabled-looking, checkmark icon).
- Clicking fires a server action to add the `ListItem`. On success → top-right toast "Added to Wishlist".
- If somehow a duplicate is attempted, it is a silent no-op server-side (Prisma `upsert` or the unique constraint handles it).

### "Add to list…" button

- Appears alongside "Add to Wishlist" on search rows and on the media item page.
- Opens a slide-over `Sheet` containing all the user's lists.
- Each row shows: list name + item count.
- If the item is already in a list, that row is greyed out and labelled "Already added" (not tappable).
- Tapping any eligible row adds the item and closes the sheet with a toast "Added to [list name]".
- At the bottom of the list: a "New list…" row that opens an inline name input to create a new list on the fly, then immediately adds the item to it.

## Acceptance criteria

- [ ] "Add to Wishlist" and "Add to list…" appear on search result rows (authenticated users only).
- [ ] Same actions appear on the `/media/[id]` page.
- [ ] "Add to Wishlist" button reflects current state on page load (pre-loaded from server).
- [ ] Successful wishlist add triggers top-right toast "Added to Wishlist".
- [ ] List picker sheet lists all user lists with name + item count.
- [ ] Already-added lists are greyed out and non-interactive.
- [ ] "New list…" inline creation works within the picker.
- [ ] Adding from picker triggers toast "Added to [list name]".
