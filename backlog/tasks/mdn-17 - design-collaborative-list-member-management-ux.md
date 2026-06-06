---
id: MDN-17
title: Design collaborative list member management UX
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 19:28'
labels:
  - UX
  - collaborative-lists
dependencies:
  - MDN-15
ordinal: 35000
---

## Description

Design the UX for the list owner removing a collaborator, and for a non-owner member leaving a shared list.

## Context

- Only the owner can remove *members* from the list (i.e. revoke someone's access).
- Any non-owner member can leave a list voluntarily.
- **Item removal is separate and open** — anyone on the list can remove any item at any time, with no ownership restriction. Member management (this task) is only about who has access to the list, not about items.
- When a member leaves or is removed, their enthusiasm scores and `added_by` attributions remain — soft attribution, no data deleted.
- Only the owner can delete the list entirely.

## Questions to resolve

- Where does the member list live? (list settings page, sidebar, members panel on the list page)
- How does the owner remove a member — is there a confirmation step given it's not reversible without re-inviting?
- How does a member leave? (settings/profile area, leave button on the list page — where exactly is it discoverable?)
- Is "leave list" a destructive-feeling action that needs confirmation, or is it treated as low-stakes?
- What does each party see immediately after removal/departure? (owner: member removed from list; removed member: list no longer appears in their lists)
- Should departed member attributions ("Added by @username") be visually different after they're no longer a member?
