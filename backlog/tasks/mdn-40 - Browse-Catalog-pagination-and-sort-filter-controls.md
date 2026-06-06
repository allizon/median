---
id: MDN-40
title: 'Browse Catalog: pagination and sort/filter controls'
status: To Do
assignee: []
created_date: '2026-06-06 22:50'
labels:
  - browse-catalog
  - ux
dependencies: []
priority: medium
ordinal: 65000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The catalog is currently capped at 50 results. As the catalog grows this will silently hide items. Add pagination (or infinite scroll) and surface sort/filter options so the full catalog is always reachable.

## Scope

**Pagination:** Load-more button or page-based navigation. Load-more is lower friction for a browse context. Page size 20–25 is a good starting point.

**Sort options:** Title A–Z (current default), Year newest first, Year oldest first.

**Existing type filter chips** (Movies / TV Shows) already cover the primary filter case — no additional filter facets needed for now.

## Acceptance criteria

- All catalog items are reachable (no silent 50-item truncation)
- Sort control renders alongside the filter chips
- URL params reflect current page/sort so the state is shareable and back-navigable
- Empty state (zero results after filtering) is handled gracefully
<!-- SECTION:DESCRIPTION:END -->
