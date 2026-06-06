---
id: MDN-32
title: Design create list UX flow (personal and collaborative)
status: To Do
assignee: []
created_date: '2026-06-06'
updated_date: '2026-06-06'
labels:
  - UX
  - media-lists
  - collaborative-lists
dependencies:
  - MDN-12
ordinal: 41000
---

## Description

Design the UX for creating a new list — both personal and collaborative. MDN-12 made decisions for personal list creation (name + visibility in a slide-over Sheet) but predates the collaborative list model. This task revisits creation holistically and decides whether personal and collaborative lists share a creation flow or diverge.

## Context

- Personal list creation is currently designed as a Sheet with name + visibility (MDN-12, Done). That design needs to be reviewed in light of the enthusiasm score model and the collaborative list feature.
- Collaborative lists have members. The open question is whether membership is set at creation time or always added post-creation via MDN-15's invite flow.
- The distinction between a personal list and a collaborative list may not be a type chosen upfront — it may emerge naturally (a personal list becomes collaborative when you invite someone).
- The default Wishlist already exists for every user and cannot be deleted or renamed. Any new list created by the user is either personal or collaborative.

## Decisions

| Question | Decision |
|---|---|
| Is "collaborative" a mode or an outcome? | **Outcome.** All lists start personal. A list becomes collaborative when the first member is invited. No upfront type selection. |
| Invite during creation or after? | **Hybrid.** Creation is always quick (name + visibility only). Immediately after creation, an optional inline nudge appears: "Share this list with someone?" — skippable. This is the natural entry point for the list becoming collaborative without forcing it. |
| Visibility options | **Private / Public only.** Drop `friends` for Phase 1 — the social graph is deferred. A collaborative list's member-scoped access is handled by membership, not visibility. |
| Entry points | **One "New list" button** handles both personal and collaborative lists. No separate "New shared list" CTA needed — collaborative emerges from the post-creation nudge. |

## Implementation plan

### Step 1: Schema migrations

- **Rename `ListVote` → `ListItemScore`**, adding a `score Int` (0–4) field. Every row represents one user's score on one list item. No null scores — absence of a row means unscored.
- **`ListMember`** → add `status` enum (`pending` / `accepted`). Existing members backfilled to `accepted`. Required for the invite flow (MDN-15, MDN-35).

### Step 2: Server actions

| Action | Notes |
|--------|-------|
| `createList(name, visibility)` | Standalone — no `mediaId`. Currently missing; `createListAndAdd()` always requires media. |
| `setListItemScore(listItemId, score)` | Upsert a `ListItemScore` row. Score of 0 on a collaborative list triggers item removal. |
| `updateList(id, { name?, visibility })` | Wishlist guard: reject name changes when `isDefaultWishlist`. |
| `deleteList(id)` | Reject when `isDefaultWishlist`. |
| `removeListItem(listItemId)` | Owner-scoped for personal lists; open (anyone) for collaborative. |

### Step 3: Create list Sheet

The existing Sheet in `add-to-list-sheet.tsx` creates-and-adds in one transaction and cannot be reused as-is. A dedicated create list Sheet is needed:
- Fields: name (required) + visibility (Private / Public, default Private)
- On success: shows post-creation nudge inline — "Share with someone?" with username/link input, skippable
- Then navigates to `/lists/[id]`

### Step 4: `/lists/[id]` page (MDN-29)

Base personal list shell — destination after creation:
- Header: name, visibility badge, item count, Edit / Delete controls
- Item rows: title, type, year, enthusiasm score picker, Remove, Log it
- Default sort: score descending (unscored items treated as neutral)
- Empty state: prompt + CTA to catalog search

### Step 5: Enthusiasm score picker component

Shared component used on both personal and collaborative list item rows. Built once, configured by context:
- On personal lists: scores 0–4, no removal consequence for 0
- On collaborative lists: scores 0–4, score of 0 triggers item removal with a clear warning before confirming

### Step 6: Post-creation invite nudge

Inline in the Sheet after successful creation. "Invite someone to this list?" with username input and/or shareable link (MDN-35). Skippable — most list creations will skip it. When acted on, transitions the list from personal to collaborative and hands off to the MDN-15 invite flow.

### Implementation order

```
Schema migration (ListItemScore, ListMember.status)
  → createList() server action
    → Create list Sheet
      → /lists/[id] page (MDN-29)
        → setListItemScore() server action
        → Enthusiasm score picker component
          → Post-creation invite nudge
            → MDN-15 (full invite flow)
```

## Reference

- MDN-12 (personal list creation decisions, now Done)
- MDN-15 (collaborative list invite — depends on post-creation nudge from this task)
- MDN-29 (personal list implementation — `/lists/[id]` is its core deliverable)
- MDN-35 (shareable invite link — surfaced in post-creation nudge)
- docs/product-vision-phase-1.md
- docs/user-flows.md
