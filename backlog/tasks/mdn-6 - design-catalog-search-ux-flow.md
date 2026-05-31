---
id: MDN-6
title: Design catalog search UX flow
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 19:28'
labels:
  - UX
dependencies: []
ordinal: 24000
---

## Description

Design the UX flow for searching the shared media catalog.

## Context

- Search is ILIKE/full-text on `title`, optionally filtered by media type (PRD 5.2).
- Results include: title, year, creator, type, community average rating.
- From search results, the primary action is "Add to Wishlist"; secondary is "Add to list…" (PRD 5.4).
- Logged-out visitors can view search results and community average ratings (PRD 3, Media story 6).
- Search is also the entry point for the "Log Something" modal on the home dashboard (PRD 5.8, Widget 1).

## Questions to resolve

- Is search a dedicated page (`/search`) or an inline/modal experience?
- How are results presented? (list vs. grid, what metadata is shown inline)
- What is the empty-state experience when no results are found? (Should "Add new item" be surfaced here?)
- How does the type filter work? (tabs, dropdown, chip filter)
- Are "Add to Wishlist" and "Add to list…" actions on each result row, or on the media detail page?
- What does the search experience look like for logged-out visitors? (no add actions)
