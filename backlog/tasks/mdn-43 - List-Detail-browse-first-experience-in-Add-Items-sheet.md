---
id: MDN-43
title: 'List Detail: browse-first experience in Add Items sheet'
status: To Do
assignee: []
created_date: '2026-06-06 22:51'
labels:
  - list-detail
  - ux
dependencies: []
priority: low
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The current "Add items" sheet (`AddToListSearchSheet`) opens to an empty search box — the user must know what they want before they can act. Reuse the browse-first pattern from the catalog page: show all catalog items when the sheet first opens, with the search box above to narrow. This matches the mental model of "look at what's available, then pick something."

## Acceptance criteria

- "Add items" sheet opens showing the full catalog (same 50-item list, same sort as Browse Catalog)
- Search field filters the list as the user types (existing debounce behaviour preserved)
- Type filter chips (Movies / TV Shows) available inside the sheet
- Items already in the list are marked "Added ✓" and non-interactive
- Clearing the search returns to the full browse view

## Implementation notes

- `AddToListSearchSheet` currently calls `searchCatalog(query)` which returns `[]` for an empty query. Change `searchCatalog` to return all items when query is empty (same change already made to the search page), or pass the full catalog list as `initialResults` from the server component.
<!-- SECTION:DESCRIPTION:END -->
