---
id: MDN-38.1
title: >-
  Convert AddToListSearchSheet, AddMediaSheet, and AddToListSheet to centered
  modals
status: To Do
assignee: []
created_date: '2026-06-12 14:15'
labels:
  - ui
  - ux
  - refactor
dependencies: []
parent_task_id: MDN-38
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MDN-38 introduced the `Modal`/`ModalContent` primitive (`src/components/ui/modal.tsx`) and converted `ListSheet` → `ListModal` for list create/edit (commit a676a1f). MDN-38 originally scoped `AddToListSearchSheet`, `AddMediaSheet`, and `AddToListSheet` to remain as Sheets because of their longer/scrollable content (search results, multi-step forms). The direction has since broadened: **all** side sheets should now use the centred Modal pattern, with scrollable content areas inside `ModalContent` where needed.

## Components to convert

- `AddToListSearchSheet` (`src/components/add-to-list-search-sheet.tsx`) — opened via "+ Add items" on the list detail page (`src/app/(app)/lists/[id]/list-detail.tsx`)
- `AddMediaSheet` (`src/components/add-media-sheet.tsx`) — opened from catalog search "Add new" and the public profile "+ Add Media" button
- `AddToListSheet` (`src/components/add-to-list-sheet.tsx`) — list picker opened from the media detail page "Lists" button

## Reference pattern

Follow the same conversion approach used for `ListSheet` → `ListModal`: swap `Sheet`/`SheetContent` for `Modal`/`ModalContent`, keep the same props/structure, and add internal scroll handling for content that no longer fits a full-height panel.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AddToListSearchSheet, AddMediaSheet, and AddToListSheet each render via Modal/ModalContent instead of Sheet/SheetContent
- [ ] #2 Longer content (catalog search results list, multi-field media form with season inputs) scrolls within the modal body without the modal exceeding the viewport
- [ ] #3 All existing call sites (list detail "+ Add items", catalog search "Add new", profile "+ Add Media", media detail "Lists" picker) continue to work with no behavior change beyond the container swap
- [ ] #4 Close/cancel, submit, and Esc-to-close behave consistently with the existing ListModal
<!-- AC:END -->
