---
id: MDN-15
title: Design collaborative list invite UX
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 17:28'
labels:
  - UX
  - collaborative-lists
dependencies:
  - MDN-12
ordinal: 14000
---

## Description

Design the UX for inviting a collaborator to a list and the accept/decline flow for the invited user.

## Context

- The list owner invites another user by username; on acceptance they become a `ListMember` (PRD 5.5, stories 1–2).
- No email notifications in v1 — the invitee must discover the invite within the app (PRD 2, no notifications in v1).
- There is no in-app notification system in v1 (deferred to Phase 2), so the invite surface needs careful thought.

## Questions to resolve

- Where does the invite action live? (list settings page, list page header, member management panel)
- How does the owner enter the invitee's username? (inline input on the settings page, modal)
- How does the invitee discover a pending invite with no notification system? (banner on the list page if they visit the URL, a dedicated "Pending invites" section somewhere in the app, dashboard widget)
- What happens if the invitee visits the list URL before accepting — can they preview the list?
- How does the invitee accept or decline? (dedicated invites page, inline on the list page)
- What does the owner see while the invite is pending? (member shown as "pending" in the member list)
- What happens if the invitee declines — can the owner re-invite them?
