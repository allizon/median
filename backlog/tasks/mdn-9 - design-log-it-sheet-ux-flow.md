---
id: MDN-9
title: Design "Log it" sheet UX flow
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 17:28'
labels:
  - UX
  - media-logging
dependencies:
  - MDN-6
ordinal: 8000
---

## Description

Design the UX flow for the "Log it" sheet — the primary mechanism for creating and updating DiaryEntries.

## Context

- The sheet is accessible from three entry points: the media item's page, a list/wishlist item, and the collaborative list "mark as done" action (which pre-fills `status=finished`) (PRD 5.3).
- Fields: status (required), rating (optional, half-stars 1–5 stored as 1–10), notes (optional, private), date finished (optional date).
- Status values: `in-progress`, `paused`, `abandoned`, `finished`.
- The sheet creates a new DiaryEntry or updates an existing one — the same UI handles both cases.
- Rating is only meaningful for `finished` status but is not blocked for others (enforced at app layer, not system layer).
- The home dashboard "Log Something" widget (Widget 1) also uses this sheet, preceded by a catalog search step (PRD 5.8).

## Questions to resolve

- Is this a bottom sheet, modal dialog, or slide-over panel?
- How does the UI adapt when opened for an existing entry vs. a new one? (e.g., pre-filled values, "Update" vs. "Log it" CTA)
- How does the status picker work? (segmented control, radio buttons, dropdown)
- How is the half-star rating interaction implemented? (clickable stars, slider)
- Should rating and date finished only be shown/prominent when `status=finished`, or always visible?
- What is the "Log Something" entry point flow? (search → select result → sheet opens, or search embedded in the sheet)
- What does the sheet look like when opened from the home dashboard Widget 1 vs. from a list item? (same sheet, different context header?)
