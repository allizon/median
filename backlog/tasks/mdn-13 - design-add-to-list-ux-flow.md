---
id: MDN-13
title: Design add-to-list UX flow
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 17:28'
labels:
  - UX
  - media-lists
dependencies:
  - MDN-6
  - MDN-12
ordinal: 12000
---

## Description

Design the UX for adding media items to lists — both the one-tap "Add to Wishlist" shortcut and the "Add to list…" picker flow.

## Context

- Primary action: "Add to Wishlist" — one tap, adds directly to the default Wishlist (PRD 5.4, story 2).
- Secondary action: "Add to list…" — opens a picker to choose any list (PRD 5.4, story 3).
- Adding a duplicate to a list is a no-op (PRD 5.4).
- Story 6 (add media items to any list) subsumes this flow — the picker must show all user lists.
- This flow is also the entry point for the "Log it" shortcut on list items (covered by MDN-9).

## Questions to resolve

- Where exactly do these actions appear — on search result rows, on the media item page, or both?
- What does the list picker look like? (bottom sheet, dropdown, modal with list of cards)
- Does the picker show item counts and visibility badges to help the user choose?
- Can the user create a new list from within the picker, or must they create it first?
- What is the feedback for a successful "Add to Wishlist"? (toast, button state change, nothing?)
- How is the duplicate no-op communicated? (silent, or a subtle "already in list" indicator?)
- When the item is already in the Wishlist, does the "Add to Wishlist" button change state?
