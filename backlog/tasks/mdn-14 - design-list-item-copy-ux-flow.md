---
id: MDN-14
title: Design list item copy UX flow
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 17:28'
labels:
  - UX
  - media-lists
dependencies:
  - MDN-12
  - MDN-13
ordinal: 13000
---

## Description

Design the UX for copying one item or all items from one list to another.

## Context

- Copy works in any direction: personal ↔ personal, collaborative ↔ personal (PRD 5.4, story 8).
- Duplicate items are silently skipped (PRD 5.4).
- Collaborative list story 11 ("copy items from a collaborative list to one of my personal lists") uses the same mechanism.

## Questions to resolve

- Where is the "copy item" action surfaced on a list item? (context menu, overflow menu, swipe action)
- Where is the "copy all" action surfaced? (list-level overflow/settings menu)
- Are "copy one" and "copy all" the same flow with different scope, or separate interactions?
- How does the user select the destination list? (same picker as "Add to list…" from MDN-13, or a dedicated picker)
- How are silently skipped duplicates handled at the UX level? (count shown at end, e.g. "3 items added, 2 already present" — or fully silent?)
- Can the user copy to a list they don't own (e.g., a collaborative list they're a member of)?
