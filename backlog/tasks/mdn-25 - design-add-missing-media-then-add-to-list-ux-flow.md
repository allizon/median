---
id: MDN-25
title: Design UX flow for adding a missing media item then adding it to a list
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31'
labels:
  - UX
  - media-lists
dependencies:
  - MDN-6
  - MDN-7
  - MDN-13
ordinal: 57000
---

## Description

Design the end-to-end UX flow for the case where a user searches the catalog, finds no match, creates the new media item, and immediately adds it to a list — all in a single, uninterrupted journey.

## Context

- This is a compound flow that bridges MDN-7 (add media) and MDN-13 (add to list).
- The trigger is a catalog search (MDN-6) that returns zero results.
- The user's original intent (e.g. "add this to my Watchlist") must be preserved across the item-creation step so they are not stranded after saving.
- PRD 5.2 allows any logged-in user to add a media item.
- PRD 5.4 stories 2–3 cover adding to Wishlist and the list picker.
- After the item is saved, the system should resume the original add-to-list intent without requiring the user to re-search.

## Questions to resolve

- How is the "not found" state communicated during search, and where does the CTA to create a new item live?
- Is the creation step a modal, a slide-over panel, or a dedicated page — and does this choice affect how we resume the add-to-list intent?
- When the user finishes creating the item, do we land them on: (a) the list picker immediately, (b) the new item's page with the add-to-list action highlighted, or (c) back in the list context with the item already queued?
- How do we handle the case where the user abandons item creation mid-flow — do we discard, auto-save a draft, or prompt?
- If the user arrived via the list picker (e.g. from MDN-13), can they create a missing item inline from within the picker?
- How is the newly created item visually distinguished in the list after it is added (e.g. "just added by you" badge)?
- Should the flow differ between the Wishlist one-tap shortcut and the full list picker?
