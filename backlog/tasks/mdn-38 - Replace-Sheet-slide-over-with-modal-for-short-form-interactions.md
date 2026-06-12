---
id: MDN-38
title: Replace Sheet/slide-over with modal for short-form interactions
status: To Do
assignee: []
created_date: '2026-06-06 22:50'
updated_date: '2026-06-06 22:59'
labels:
  - ui
  - ux
  - refactor
dependencies: []
priority: high
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The full-height slide-over Sheet (480px wide panel on desktop, full-screen on mobile) is too heavy for short-form interactions like creating a list, editing a list name, or picking a list to add an item to. These interactions contain 1–2 fields and a submit button — they warrant a centred modal dialog, not a side panel.

## Scope

Replace Sheet usage with a modal for:
- Create list (currently `ListSheet` in create mode)
- Edit list (currently `ListSheet` in edit mode)
- Any future short-form confirmations

Keep Sheet for:
- `AddToListSheet` (list picker with scrollable list — benefits from the full panel)
- `AddMediaSheet` (multi-step form with seasons — benefits from the full panel)
- `AddToListSearchSheet` (search + results list)

## Implementation notes

- A `Modal` component needs to be built on `@base-ui/react/dialog`, matching the existing confirm-dialog pattern in `list-detail.tsx` but styled as a reusable primitive.
- `ListSheet` → rename/refactor to `ListModal` and swap the container component.
- Centred overlay, max-w-sm, same animation tokens as the existing confirm dialog.
<!-- SECTION:DESCRIPTION:END -->
