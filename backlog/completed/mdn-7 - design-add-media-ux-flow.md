---
id: MDN-7
title: Design add media UX flow (incl. TV seasons)
status: Done
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31'
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

## Decisions

| Question | Decision |
|---|---|
| Modal vs. dedicated page | **Modal / slide-over** — stays in search context; preserves intent for add-to-list flow (MDN-25) |
| Type selector | **Segmented control** — 3 values (Movie / TV Show / Book), works on mobile |
| TV seasons step | **Conditional inline section** — appears below the base fields when type = TV Show |
| Minimum season entry | Season number (required) + optional title; rows can be added/removed dynamically |
| Skip seasons? | **Yes** — the seasons section is optional; seasons can be added incrementally later (PRD 5.2 story 5) |
| After saving | **Resume original intent** — if the user arrived with add-to-list intent, proceed directly to the list picker / Wishlist action; otherwise land on the new item's page |
| Duplicate prevention | **Server-side check on submit** — after the user submits, a server query matches on title+type; near-duplicates are shown inline with "Use this item" / "Create anyway" options |

## UX Flow

### Entry point

The "Add new item" CTA appears in the **empty state** of a catalog search (zero results). It is only shown to authenticated users.

### Step 1 — Add item modal

A slide-over / bottom sheet (responsive) opens over the search page. Fields:

1. **Title** (text input, required) — autofilled with the search query
2. **Type** (segmented control: Movie / TV Show / Book, required)
3. **Year** (4-digit number input, optional)
4. **Creator** (text input, optional — label adapts: "Director" for Movie, "Author" for Book, "Creator / Showrunner" for TV Show)

**TV Show conditional section** (appears when type = TV Show):

- "Define seasons" disclosure section, **collapsed by default** — user opts in
- When expanded: a repeating row per season — **Season number** (auto-increments, editable) + **Season title** (optional text)
- "+ Add another season" link appends a new row
- Rows can be removed with a trash icon

**Mobile:** the slide-over opens **full height** to maximise form space, especially when season rows are added. On desktop it is a standard right-side panel.

### Step 2 — Duplicate check

On submit, the form sends a server-side query matching on title + type. If near-duplicates exist:

- The form stays open
- A warning banner lists the near-matches with title, year, and type, each with a **"Use this item"** button
- A **"No, create new item"** button allows the user to proceed despite the warning

### Step 3 — Save & resume

On successful save:

- If the user has **pending add-to-list intent** (arrived from search with "Add to Wishlist" or "Add to list…" context): close the modal and immediately fire the intended list action against the new item
- Otherwise: close the modal and navigate to the **new item's media page**

## Questions to resolve

_All questions resolved._
