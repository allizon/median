---
id: MDN-3
title: Book series - analogy to TV seasons worth exploring
status: To Do
assignee: []
created_date: ''
updated_date: '2026-06-06'
labels:
  - deferred
dependencies: []
ordinal: 23000
---

## Status note

**Deferred.** Books are out of scope for Phase 1. The app will focus on movies and TV first. Revisit this question when books are added (Phase 2+).

## Question

Should book series be modelled analogously to TV shows with seasons? Or should they remain flat, with each book as an independent media item?

## The tension

TV seasons are tightly coupled to their show — a season without a show makes no sense, and you navigate to a season *through* the show. Books in a series are looser: you can read *The Two Towers* without having read *The Fellowship of the Ring*, or read it as a standalone. The series is more of a grouping than a hierarchy.

This means the TV `Media → Season → DiaryEntry` hierarchy may not be the right shape for books.

## Options to consider

**Option A — Keep books flat (status quo)**
Each book is its own `Media` item. If a user wants to track a series, they add each book separately. Series membership is not modelled. Simple, no schema changes.

**Option B — Series as a grouping (not a hierarchy)**
Add an optional `series` field to `Media` (a string or FK to a `Series` table). Books in the same series are linked but remain independent media items. A user can see "all books in this series you've logged" as a view, but there's no parent entry required.

**Option C — Mirror the TV model**
Add a `Volume` or `Entry` concept (analogous to `Season`) for books. Requires a series-level diary entry before logging individual books. This mirrors TV exactly but feels wrong — it forces a parent record for something that may not need one.

## Recommendation (to be decided)

Option B seems most natural: series as a lightweight grouping, not a structural hierarchy. Books remain first-class media items. The series context is discoverable (e.g. "Book 3 of 7 in the Expanse series") without enforcing a parent/child relationship.

Option A (stay flat) is also acceptable for v1 given the small user base. Option C is almost certainly wrong.

## Context

- Current `Season` model is explicitly scoped to `type=tv_show` — no change needed unless we decide to extend the concept.
- Any change to model book series would require schema additions and should be decided before Phase 3 (external catalog enrichment), since Open Library has series metadata that could populate this automatically.

## Reference

- PRD section 5.2 (Media Catalog)
- PRD Phase 3 (External Catalog Enrichment)
- Current `Season` model in PRD section 4
