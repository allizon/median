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
| Is "collaborative" a mode or an outcome? | **Outcome (Option B).** All lists start personal. A list becomes collaborative when the first member is invited. No upfront type selection. |

## Remaining questions to resolve

**If collaborative, do you invite during creation or after?**
- Option A (invite during creation): Creation flow includes an optional "Add members" step. Useful if you're creating a list specifically to share with someone.
- Option B (invite always post-creation): Create the list first, then invite from the list page. Simpler creation, but an extra step before the collaborative experience starts.
- A hybrid may work: creation is always quick (name only), with an optional inline nudge ("Invite someone to this list?") immediately after creation.

**What fields are required at creation?**
- Name is required (MDN-12 decision).
- Visibility (private/friends/public) — does this still apply to collaborative lists, or is visibility implicit for collaborative lists?
- Should a collaborative list have a description field for context?

**Entry points:**
- Widget 3 ("My Lists") "New list" button — already designed in MDN-12.
- Is there a separate "New shared list" entry point, or does the same button handle both?
- Should the home dashboard surface a more prominent CTA for creating a shared list, given that collaborative lists are the core Phase 1 use case?

## Reference

- MDN-12 (personal list creation decisions, now Done)
- MDN-15 (collaborative list invite, depends on this task's outcome)
- MDN-29 (personal list implementation)
- docs/product-vision-phase-1.md
