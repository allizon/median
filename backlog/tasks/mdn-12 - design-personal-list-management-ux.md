---
id: MDN-12
title: Design personal list management UX
status: Done
assignee: []
created_date: '2026-05-31'
updated_date: '2026-06-01 18:13'
labels:
  - UX
  - media-lists
dependencies: []
ordinal: 30000
---

## Description

Design the UX for creating and managing personal lists, including visibility settings and item removal.

## Context

- Users can create named lists beyond the default Wishlist (PRD 5.4, stories 4–5, 7).
- Visibility options: `private`, `friends-only`, `public` (PRD 5.4).
- The default Wishlist (`is_default_wishlist=true`) cannot be deleted (PRD 5.4).
- The home dashboard Widget 3 ("My Lists") shows all lists as cards with a "New list" button (PRD 5.8).

## Questions to resolve

- Where does list creation live — modal triggered from Widget 3, or a dedicated page?
- What fields are shown at creation time? (name required; visibility required or defaulted to private?)
- How does the user edit a list after creation? (list settings page, inline edit, modal)
- Where is visibility changeable post-creation? (same settings page/modal)
- How is item removal confirmed? (swipe, button + confirmation dialog, or immediate with undo toast?)
- What is the empty-list state? (prompt to search and add, or just empty)
- Can the default Wishlist be renamed? (not specified in PRD — decision needed)

## Decisions

| Question | Decision |
|---|---|
| Where list creation lives | `Sheet` (slide-over) opened by Widget 3's "New list" button — consistent with the add-to-list Sheet shipped in MDN-13. No dedicated page. |
| Fields at creation | Name (required, 1–200 chars) + visibility radio (`private` / `friends` / `public`), defaulting to `private`. |
| Editing a list post-creation | "Edit" affordance in the `/lists/[id]` page header opens an edit `Sheet` (same component as create, pre-filled). |
| Where visibility changes | The same edit `Sheet` — single surface for name + visibility. |
| Item removal | Optimistic remove + top-right **undo toast** ("Removed [title]" · Undo). No blocking confirmation dialog. |
| Empty-list state | Prompt copy + primary CTA linking to catalog search to add the first item. |
| Default Wishlist rename | **No.** Name is locked (load-bearing: "Add to Wishlist", Widget 5 "Up Next", domain term). |
| Default Wishlist visibility | **Editable** (defaults `private`). Wishlist edit Sheet shows the visibility control only — no name field. |
| Default Wishlist delete | **No** (PRD 5.4). Delete affordance hidden when `isDefaultWishlist`. |
| List page route | Single shared `/lists/[id]` shell. MDN-12 owns the base shell; MDN-16 layers collaborative affordances (voting, attribution, ranked sort, member-scoped removal) onto it via extension points. |

## Flow description

### Creating a list (Widget 3 → create Sheet)

- Widget 3 ("My Lists") shows a **"New list"** button. Tapping it opens a slide-over `Sheet`.
- Fields: **Name** (text input, required) and **Visibility** (radio: Private / Friends-only / Public, default Private).
- "Create" fires a `createList(name, visibility)` server action, closes the Sheet, shows a top-right toast "Created [name]", and the new card appears in Widget 3.
- This is creation *without* a media item — distinct from MDN-13's inline `createListAndAdd` (which creates-and-adds from the picker). Both code paths persist `visibility=private` by default; this Sheet additionally exposes the visibility choice up front.

### The `/lists/[id]` personal-list page (base shell)

- **Header:** list name, visibility badge, item count. Owner-only controls: **Edit** (opens edit Sheet) and **Delete** (hidden when `isDefaultWishlist`).
- **Body:** list items, each row showing title / type / year / creator (PRD 5.4), a per-item **Remove** action, and the **"Log it"** shortcut (cross-ref MDN-9).
- **Sort:** date added (the ranked-by-votes toggle is collaborative-only, added by MDN-16).
- **Access control:** management actions are owner-only. Non-owner viewing of friends/public lists exposes only the public surface fields per CONTEXT.md; this base shell renders the owner-management view.
- **Extension points for MDN-16:** item row (slot for vote button + `added_by` attribution), sort control, and the removal permission predicate.

### Editing a list

- "Edit" in the header opens the edit `Sheet`, pre-filled.
- Regular list: editable **Name** + **Visibility**.
- Default Wishlist: **Visibility only** (no name field, no delete). Saving fires `updateList(id, { name?, visibility })` with Wishlist guards enforced server-side.

### Removing an item

- Per-item **Remove** removes optimistically and shows a top-right **undo toast** ("Removed [title]" with an Undo action).
- Undo within the toast window restores the item; otherwise the removal is committed via `removeListItem(listItemId)`.
- **Base permission gate (MDN-12):** the list owner may remove any item on a list they own. MDN-16 extends this for collaborative lists (members remove only items they added; owner removes any).

### Deleting a list

- "Delete" (regular lists only) confirms via a destructive-action dialog (this is irreversible, unlike item removal), then calls `deleteList(id)` and navigates back to the dashboard. `deleteList` rejects `isDefaultWishlist` server-side as a backstop.

### Empty-list state

- When a list has no items: a centred prompt ("Nothing here yet") + primary CTA **"Find something to add"** linking to catalog search (MDN-6).

## Implied server actions (for the downstream implementation task — not built here)

Gaps in `src/lib/actions/list.ts` this design requires:

- `createList(name, visibility)` — create a list with no initial item (current `createListAndAdd` requires a `mediaId`).
- `updateList(id, { name?, visibility })` — Wishlist guard: ignore/reject `name` changes when `isDefaultWishlist`.
- `deleteList(id)` — reject when `isDefaultWishlist`.
- `removeListItem(listItemId)` — owner-scoped for now; collaborative member-scoping added by MDN-16.

The `/lists/[id]` route does not exist yet (Widget 3 cards already link to it) — this design defines it.

## Acceptance criteria

- [ ] Widget 3 "New list" button opens a create `Sheet` with name (required) + visibility (default Private).
- [ ] Creating a list shows a confirmation toast and the card appears in Widget 3.
- [ ] `/lists/[id]` renders header (name, visibility badge, item count) and item rows (title/type/year/creator).
- [ ] Each item row has a Remove action and a "Log it" shortcut.
- [ ] Item removal is optimistic with a working undo toast.
- [ ] Owner-only Edit opens a pre-filled Sheet; saving updates name + visibility.
- [ ] Default Wishlist edit Sheet shows visibility only (no name field), and exposes no Delete affordance.
- [ ] Default Wishlist visibility is changeable; its name and existence are not.
- [ ] Regular lists can be deleted via a destructive-confirm dialog; navigates back to the dashboard.
- [ ] Empty-list state shows a prompt + CTA to catalog search.
- [ ] Base item-removal gate is owner-only, with MDN-16 noted as extending it for collaborative members.
