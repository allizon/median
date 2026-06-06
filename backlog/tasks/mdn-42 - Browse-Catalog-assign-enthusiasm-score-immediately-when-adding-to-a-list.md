---
id: MDN-42
title: 'Browse Catalog: assign enthusiasm score immediately when adding to a list'
status: To Do
assignee: []
created_date: '2026-06-06 22:51'
labels:
  - browse-catalog
  - ux
  - enthusiasm-score
dependencies:
  - MDN-41
priority: medium
ordinal: 67000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Currently a user adds an item to a list and then has to navigate to the list detail page to assign an enthusiasm score. This is a friction-heavy two-step flow. When an item is successfully added to a list, surface an inline score picker (0–4) in the confirmation state so the user can optionally score it in the same interaction.

## Design options

**Option A — Score step in the add-to-list popover (preferred):**
After checking a list in the add-to-list popover (MDN-41), the row expands to show the 0–4 score picker inline. The user can score or dismiss. Calls `setListItemScore` on selection.

**Option B — Score prompt in the success toast:**
"Added to [list]" toast includes a mini score row. More intrusive but requires no UI redesign.

## Acceptance criteria

- User can optionally assign a score (0–4) immediately after adding an item to a list
- Scoring is optional — the interaction can be dismissed without scoring
- Score is persisted via `setListItemScore(listItemId, score)`
- Works from both the catalog browse flow and any other add-to-list entry point
<!-- SECTION:DESCRIPTION:END -->
