---
id: MDN-15
title: Design collaborative list invite UX
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 19:28'
labels:
  - UX
  - collaborative-lists
dependencies:
  - MDN-12
ordinal: 33000
---

## Description

Design the UX for inviting a collaborator to a list and the accept/decline flow for the invited user.

## Key design implication

Per MDN-32, all lists start as personal. **The first invite is the moment a list becomes collaborative.** This means the invite flow carries more weight than simply "adding a member" — it's a mode transition. The UX should reflect that: inviting the first person may feel like a distinct gesture (turning a personal list into a shared one) rather than a routine member management action.

## Context

- The list owner invites another user by username; on acceptance they become a `ListMember` (PRD 5.5, stories 1–2).
- No email notifications in v1 — email is deferred to a later phase.
- **In-app notifications ARE available from day one** (see MDN-31). A pending list invite should trigger an in-app notification to the invitee.

## Questions to resolve

- Where does the invite action live? (list settings page, list page header, member management panel)
- How does the owner enter the invitee's username? (inline input on the settings page, modal)
- In-app notification aside, is there a secondary discovery surface for pending invites? (dedicated "Pending invites" section in settings or dashboard, as a fallback)
- What happens if the invitee visits the list URL before accepting — can they preview the list?
- How does the invitee accept or decline? (via the notification, dedicated invites page, inline on the list page)
- What does the owner see while the invite is pending? (member shown as "pending" in the member list)
- What happens if the invitee declines — can the owner re-invite them?
