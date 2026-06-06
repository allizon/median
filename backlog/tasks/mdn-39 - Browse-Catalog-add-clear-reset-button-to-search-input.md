---
id: MDN-39
title: 'Browse Catalog: add clear/reset button to search input'
status: To Do
assignee: []
created_date: '2026-06-06 22:50'
labels:
  - ui
  - browse-catalog
dependencies: []
priority: low
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The search box on the Browse Catalog page has no way to clear the current query without manually selecting and deleting the text. Add a clear (×) button that appears inside the input when it has a value. Clicking it resets the query to empty and returns to the full browse view.

## Acceptance criteria

- Clear button (×) appears inside the right side of the input when `inputValue` is non-empty
- Clicking clear sets `inputValue` to `""` and fires a search with an empty query, returning to the full catalog list
- Clear button is not visible when the input is empty
- Button meets 44×44px touch target (can be achieved with padding)
- Keyboard: pressing Escape while the input is focused also clears and blurs
<!-- SECTION:DESCRIPTION:END -->
