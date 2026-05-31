---
id: MDN-21
title: Design public list discovery UX
status: To Do
assignee: []
created_date: '2026-05-31'
labels: [UX, friends]
dependencies: []
---

## Description

Design the public list discovery feed — the paginated list of public lists accessible to any visitor including logged-out users.

## Context

- Sorted by most recently updated (PRD 5.7).
- Shows list name, owner username, item count per card (PRD 5.7).
- Accessible to Anonymous Visitors — no login required (PRD 5.7, story 8).
- On a public list page, the following is exposed: list name, owner username, item count, each item's title/type/year/creator, community average rating per item. No individual ratings, notes, or companion data (PRD 5.4).

## Questions to resolve

- Where does this feed live? (`/discover`, `/lists`, or linked from the nav/homepage)
- What does each list card show beyond name/owner/item count? (first few media titles as a preview, type breakdown, "Updated X ago")
- Is there a filter or search on the discovery feed? (by media type, keyword — or just browse)
- What does a logged-out visitor see on a public list page vs. a logged-in user? (same content, but logged-in user sees "Add to Wishlist" / "Log it" actions on items)
- Is there an entry point to the discovery feed from the home dashboard, or is it nav-only?
- How is pagination implemented? (load more button, infinite scroll, numbered pages)
