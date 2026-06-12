---
id: MDN-41
title: 'Browse Catalog: replace "Lists" button with inline add-to-list popover'
status: To Do
assignee: []
created_date: '2026-06-06 22:50'
updated_date: '2026-06-06 22:58'
labels:
  - browse-catalog
  - ui
  - ux
dependencies: []
priority: high
ordinal: 66000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The current "Lists" button on each search result opens the full-height `AddToListSheet` slide-over, which is heavy for a simple multi-list add action. The label "Lists" is also not self-explanatory.

Replace it with an inline popover that appears anchored to the button, containing checkboxes for each of the user's lists. Checking a box adds the item to that list immediately. The popover closes when the user clicks away.

## Design notes

- Button label: **"Add to list ▾"** (or similar) — makes the intent clear
- Popover: anchored below/above the button, ~240px wide, scrollable if many lists
- Each list row: checkbox + list name + item count
- Checking an unchecked list calls `addToList(listId, mediaId)` immediately (optimistic)
- Unchecking a checked list calls `removeListItem` (needs a way to look up the listItemId — may require a small query or a different action signature)
- "New list…" row at the bottom opens the create-list modal (MDN-38)
- No Sheet, no navigation away from the catalog

## Dependencies

- Needs `@base-ui/react/popover` or equivalent — check if available; if not, a positioned `Dialog` or plain absolutely-positioned div with a click-outside handler works
- Removing an already-added item from this UI requires either knowing the `listItemId` upfront or adding a `removeFromList(listId, mediaId)` action variant
<!-- SECTION:DESCRIPTION:END -->
