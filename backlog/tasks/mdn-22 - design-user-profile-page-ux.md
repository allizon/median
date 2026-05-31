---
id: MDN-22
title: Design user profile page UX
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 17:28'
labels:
  - UX
dependencies:
  - MDN-12
priority: high
ordinal: 21000
---

## Description

Design the public profile page (`/@username`) and the owner's profile settings/edit experience.

## Context

- The profile page is defined in PRD 5.9 with three sections: header, stats bar, and featured lists.
- The page is visible to any authenticated user. Logged-out access is noted as "TBD" in the PRD but Open Question #1 resolved logged-out access as allowed in v1 — the PRD text in 5.9 needs correcting.
- Auth story 4 covers profile editing: username and display name.
- Schema additions required: `User.showInProgressOnProfile` (bool), `List.featuredOnProfile` (bool), `List.profilePosition` (int nullable).
- The owner sees a "Settings" link instead of the friend button (PRD 5.9 header).
- Featured lists: only `public` or `friends` visibility lists can be pinned; friends-only lists are only shown to accepted friends (PRD 5.9).

## Questions to resolve

- What does the profile page look like for the three viewer types: owner, accepted friend, logged-in stranger, and logged-out visitor?
- Where does the profile edit flow live? (inline edit on profile page, or a dedicated `/settings/profile` form)
- Where does the user manage featured lists and their order? (dedicated settings page, drag-and-drop on the profile page itself)
- How does `showInProgressOnProfile` get toggled? (settings page toggle, or on the profile page directly)
- The URL is `/@[username]` (decided; all PRD references updated).
- What does the stats bar show if the user has no finished items yet? (zero states)
- How are featured list cards ordered/reordered? (drag-and-drop, up/down arrows, numeric input)
