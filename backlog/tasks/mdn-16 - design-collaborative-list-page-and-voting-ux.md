---
id: MDN-16
title: Design collaborative list page and enthusiasm score UX
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-06-06'
labels:
  - UX
  - collaborative-lists
dependencies:
  - MDN-13
  - MDN-15
ordinal: 34000
---

## Description

Design the collaborative list page layout, the enthusiasm score interaction per item, the ranked sort display, and the "mark as watched" item action.

## Context

**Enthusiasm score model (replaces simple upvote):**
Each member scores each item independently on a 0–4 scale expressing how much they want to watch it. The list sorts by a weighted average score (formula TBD — participation rate should factor in so an item two people scored 3 outranks one person's 4 with no response from anyone else). Scores are per-member, not aggregate votes.

**Score meanings (labels TBD — tone should be playful/irreverent):**
- 4: Strong yes
- 3: Sure, I'm in
- 2: Fine by me
- 1: Not really, but ok
- 0: No — **immediately removes the item from the list for everyone**

A score of 0 is a hard removal, not just low enthusiasm. The UI must make this unambiguous — a "No" is not a downvote, it removes the item. Anyone on the list can remove any item at any time (no ownership restriction on removal).

**Open add / open remove:**
- Anyone on the list can add any item. No approval required.
- Anyone on the list can remove any item. No approval required.

**"Mark as watched":**
Closes the loop for the person taking the action. Opens the "Log it" sheet pre-filled as `finished`. Does not automatically remove the item from the list — other members may not have watched it yet. The app should nudge other list members via in-app notification ("X marked [title] as watched — did you watch it too?").

**Attribution:**
Each item shows `added_by` so members know who proposed it.

**In-app notifications** are available from day one (see MDN-31) — activity events (item added, score changed, item marked watched) should trigger notifications to list members.

## Questions to resolve

- How is the enthusiasm score displayed and set on each item row? (picker that opens on tap, inline segmented control, swipe action)
- What label set do we use for the 0–4 scores? (decide at design time — options in product-vision-phase-1.md)
- How is a member's current score shown at a glance on the item row? (colour-coded, label shown, numeric)
- How is the "0 = removal" consequence communicated clearly before the user commits?
- Is the weighted-average sort the default, or is there a toggle (ranked / date added)?
- What does each item row show at a glance: title, type, year, added-by, score summary — in what layout?
- How is the aggregate score displayed — show individual member scores, weighted average, or both?
- Where does "mark as watched" live on the item row — distinct button or within an overflow menu?
- Is there an empty-list state with a prompt to add the first item?
