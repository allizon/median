---
id: MDN-16
title: Design collaborative list page and voting UX
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 19:28'
labels:
  - UX
  - collaborative-lists
dependencies:
  - MDN-13
  - MDN-15
ordinal: 34000
---

## Description

Design the collaborative list page layout, the voting interaction per item, the ranked sort display, and the "mark as done" item action.

## Context

- Items are sorted by vote count descending; ties broken by `added_at` ascending (PRD 5.5, story 5).
- Any member can upvote an item once; voting is toggleable (PRD 5.5, story 4).
- "Mark as done" opens the "Log it" sheet pre-filled as `finished` — does not remove the item (PRD 5.5, story 6).
- The list page must show vote count and `added_by` per item (PRD 5.4).
- Members can only remove items they personally added; the owner can remove any item (PRD 5.5, stories 7–8).
- The home dashboard Widget 4 ("Recent Collaborative Activity") derives events from `ListItem.createdAt`, `ListVote` timestamps, and `DiaryEntry.updatedAt` — no separate activity log table (PRD 5.8).

## Questions to resolve

- How is the vote button displayed on each item row? (thumbs up, upvote arrow, heart — with count alongside)
- Is the ranked sort the default, or is there a toggle between "ranked" and "date added"?
- How is the viewer's own vote state shown? (filled vs. outline icon, colour change)
- Where does "mark as done" live on the item row — is it distinct from the "Log it" shortcut on personal lists, or the same button?
- How are owner-only controls (remove any item) visually distinguished from member controls (remove own items only)?
- What does the item row look like at a glance: title, type, vote count, added-by attribution — in what layout?
- Is there an empty-list state with a prompt to add the first item?
