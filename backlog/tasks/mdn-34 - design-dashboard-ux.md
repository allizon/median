---
id: MDN-34
title: Design dashboard UX (including empty states)
status: To Do
assignee: []
created_date: '2026-06-06'
updated_date: '2026-06-06'
labels:
  - UX
dependencies:
  - MDN-32
  - MDN-9
ordinal: 43000
---

## Description

Design the authenticated home dashboard in full, including the empty states a new user encounters before they've added anything. The dashboard is the answer to "what do I do now?" and must always feel actionable.

## Context

The dashboard currently has placeholder widgets (My Lists, Up Next, My Diary, Log Something) but has not been formally designed. The empty state is particularly important: a brand new user — especially one invited by someone else — landing on a blank dashboard is a high-risk moment that could kill engagement immediately.

The dashboard serves two modes:
- **New user (empty):** guide them into the core loop as quickly as possible
- **Returning user (populated):** surface what needs attention and what to do next

## Questions to resolve

**Empty state:**
- What does a new user see on first login? A guided prompt? A single CTA? A short explanation of the app?
- Should the empty state be different for a user who was invited to a list vs. a user who signed up independently? (The invited user already has something waiting for them.)
- What's the minimum viable action to get a new user to their "aha moment"? (Probably: add something to a list, or accept a list invite.)

**Populated state:**
- What widgets appear, and what do they show?
  - My Lists: list cards with item count and top-scored item?
  - Up Next: the top-ranked item(s) across all shared lists?
  - My Diary: recent entries?
  - Notification surface: or does that live in the nav only?
- What signals "you have something to do"? (Pending list invites, unscored items on shared lists, items marked watched by others that you haven't logged)
- How does the dashboard adapt as a user's data grows? (More lists, more diary entries — does the layout change, or just the content within widgets?)

**Layout:**
- Single column (mobile-first) vs. multi-column grid?
- Which widget gets the most prominent placement?

## Reference

- docs/user-flows.md (Flow 1: first-time user, Flow 2: returning user)
- MDN-31 (in-app notifications — notification surface relates to dashboard)
- MDN-32 (list creation — "New list" CTA lives on dashboard)
