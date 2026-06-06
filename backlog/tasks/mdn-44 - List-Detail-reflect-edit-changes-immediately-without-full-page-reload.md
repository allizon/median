---
id: MDN-44
title: 'List Detail: reflect edit changes immediately without full page reload'
status: To Do
assignee: []
created_date: '2026-06-06 22:51'
labels:
  - list-detail
  - ux
  - bug
dependencies: []
priority: medium
ordinal: 69000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After editing a list (name or visibility) via the Edit sheet, the page header still shows the old name and visibility badge until the user manually refreshes. `router.refresh()` is called in `onSuccess` but Next.js App Router's `router.refresh()` triggers a server re-render that doesn't always propagate back to the client component's local state.

## Fix

`ListDetail` should own the list metadata in React state (it already does: `const [list, setList] = React.useState(initialList)`). The `ListSheet` `onSuccess` callback should return the updated name and visibility so `ListDetail` can call `setList(...)` directly, making the header update instantly without waiting for a server round-trip.

## Acceptance criteria

- After saving an edit, the list name in the header updates immediately
- After saving an edit, the visibility badge in the header updates immediately
- No visible flash or stale state between save and update
- `router.refresh()` can be kept as a background sync but should not be the only update mechanism
<!-- SECTION:DESCRIPTION:END -->
