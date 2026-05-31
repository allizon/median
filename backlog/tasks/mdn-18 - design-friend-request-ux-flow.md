---
id: MDN-18
title: Design friend request UX flow
status: To Do
assignee: []
created_date: '2026-05-31'
labels: [UX, friends]
dependencies: []
---

## Description

Design the UX for sending a friend request from a profile page, accepting/declining incoming requests, the shareable profile link, and removing a friend.

## Context

- Friend request is sent from the target user's profile page (PRD 5.6, story 2; PRD 3, Friends story 2).
- The profile URL is `/@[username]` (PRD 5.9 URL structure). The PRD also references `/users/:username` in story 2 — these should resolve to the same page; the final URL format should be confirmed.
- There is no notification system in v1 — the addressee must discover the pending request within the app (PRD 2, no notifications).
- Friend button states on a profile page: Add Friend → Request Pending → Friends → Remove Friend (PRD 5.9).
- Removing a friend immediately revokes access to friends-only content (PRD 5.6, story 5).

## Questions to resolve

- How does the addressee discover a pending friend request with no notification system? (dedicated "Pending requests" section in settings or profile, badge somewhere in the nav)
- Where in the app does the user see and action incoming requests?
- Is "Remove Friend" on the profile page, or in a friends list elsewhere?
- Does "Remove Friend" require confirmation, given it immediately revokes content access?
- What is the shareable link copy UX? (copy-to-clipboard button, where is it on the profile page)
- After sending a request, can User A cancel it before User B responds? If so, where?
