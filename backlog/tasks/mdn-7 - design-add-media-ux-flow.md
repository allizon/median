---
id: MDN-7
title: Design add media UX flow (incl. TV seasons)
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 19:28'
labels:
  - UX
dependencies:
  - MDN-6
ordinal: 25000
---

## Description

Design the UX flow for adding a new media item to the shared catalog, including the TV season definition step.

## Context

- Any logged-in user can add a media item (PRD 5.2).
- Required fields: title, type. Optional: year, creator.
- `external_id` is stored but not exposed in the UI in v1.
- For `tv_show` items, the user can define seasons (number + optional title) at add time, or incrementally later (PRD 5.2, Media stories 4–5).
- The add flow is typically reached when a catalog search returns no results.

## Questions to resolve

- Is add media a modal (inline with search) or a dedicated page?
- What does the type selector look like? (segmented control, dropdown, radio)
- How does the TV seasons step work? Is it part of the same form, or a follow-up step after the item is saved?
- What is the minimum viable season entry? (just a number, or number + optional title)
- Can the user skip adding seasons entirely and add them later?
- After saving, where does the user land? (on the new item's page, back in search, or directly into "Log it"?)
- How do we prevent duplicates at the UX level? (search-before-add prompt, similarity warning)
