---
id: MDN-12
title: Design personal list management UX
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 17:28'
labels:
  - UX
  - media-lists
dependencies: []
ordinal: 11000
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
