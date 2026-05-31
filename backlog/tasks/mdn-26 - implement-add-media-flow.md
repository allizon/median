---
id: MDN-26
title: Implement add media flow (incl. TV seasons)
status: Done
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31'
labels:
  - feature
dependencies:
  - MDN-7
ordinal: 58000
---

## Description

Implement the add-media slide-over flow designed in MDN-7. Allows any authenticated user to add a new movie, TV show, or book to the shared catalog, with optional TV season definition.

## Design reference

See [MDN-7](./mdn-7%20-%20design-add-media-ux-flow.md) for the full UX spec and all decisions.

## Acceptance criteria

- [ ] "Add new item" CTA appears in the zero-results empty state of catalog search, visible only to authenticated users
- [ ] Clicking CTA opens a full-height slide-over (mobile) / right-side panel (desktop) over the search page
- [ ] Form fields: Title (required, autofilled from search query), Type segmented control — Movie / TV Show / Book (required), Year (optional), Creator (optional; label adapts by type)
- [ ] Submitting fires a server-side ILIKE+type duplicate check; if near-matches exist, they are shown inline with "Use this item" and "Create anyway" options; form stays open
- [ ] On clean submit (no duplicates or user chose "Create anyway"), the item is saved and the modal closes
- [ ] After save: if the user had pending add-to-list intent, that action fires immediately against the new item; otherwise the user navigates to the new item's page
- [ ] When type = TV Show, a "Define seasons" disclosure section is present, collapsed by default
- [ ] Expanding the section reveals repeating season rows: season number (auto-incremented, editable) + optional season title; rows can be added and removed
- [ ] Seasons section is fully optional — submitting without expanding it is valid
- [ ] All interactions are fully usable on mobile viewports

## Implementation notes

- Slide-over / bottom sheet component should be reusable (will also be used in add-to-list flow, MDN-13)
- Server action (or API route) needed for: (1) duplicate check, (2) create media item, (3) create seasons
- `external_id` field is not exposed in the UI in v1 but should be stored as `null` on creation
- Creator field label: `Director` (Movie), `Author` (Book), `Creator / Showrunner` (TV Show)
