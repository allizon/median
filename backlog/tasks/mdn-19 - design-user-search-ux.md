---
id: MDN-19
title: Design user search UX
status: Waiting
assignee: []
created_date: '2026-05-31'
updated_date: '2026-06-06 22:52'
labels:
  - UX
  - friends
  - deferred
dependencies: []
ordinal: 3000
---

## Status note

**Deferred.** Part of the social graph feature set, which is out of scope for Phase 1. Note: a lightweight "invite by username" surface will still be needed for collaborative list invites (MDN-15), but a full user search experience is a later-phase concern.

## Description

Design the UX for searching for other registered users by username.

## Context

- Search by exact or partial username (PRD 5.6).
- This is distinct from catalog search (media titles) — it searches User records.
- Finding a user is the precursor to visiting their profile and sending a friend request, or to inviting them to collaborate on a list.

## Questions to resolve

- Is user search a dedicated page (`/users/search`) or an inline/modal experience?
- Is it integrated with catalog search (e.g., a tab toggle: "Media" vs. "People") or entirely separate?
- What does a result row show? (username, display name, current friend status — Add Friend / Request Pending / Friends)
- What is the empty-state when no match is found? (prompt to share a profile URL for out-of-band discovery)
- Does partial matching work on display name too, or username only?
