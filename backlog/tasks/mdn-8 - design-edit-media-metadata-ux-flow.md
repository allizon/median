---
id: MDN-8
title: Design edit media metadata UX flow
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 17:28'
labels:
  - UX
dependencies:
  - MDN-7
ordinal: 7000
---

## Description

Design the UX flow for editing an existing media item's metadata.

## Context

- Any logged-in user can edit any catalog item (PRD 5.2) — no ownership or approval gate in v1.
- Editable fields: title, year, creator.
- Saves record `updated_by` and `updated_at` on the Media row.
- TV shows can have seasons added or edited incrementally.
- No automated deduplication in v1; edit is one of the few tools users have to correct bad data.

## Questions to resolve

- Where is the edit entry point? (edit button on the media item's page, inline edit, modal)
- Are seasons editable in the same form, or via a separate UI?
- How are season edits handled? (edit number/title in place, add new seasons, delete seasons — and what happens to DiaryEntries linked to a deleted season?)
- Should there be any confirmation step before saving, given edits affect all users' views of the item?
- How is `updated_by` surfaced to users? (tooltip, audit trail section, or not shown at all in v1)
