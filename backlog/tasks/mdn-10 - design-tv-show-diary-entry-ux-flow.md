---
id: MDN-10
title: Design TV show diary entry UX flow
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 17:28'
labels:
  - UX
  - media-logging
dependencies:
  - MDN-9
ordinal: 9000
---

## Description

Design the UX flow for logging TV shows, including the show-level vs. season-level entry distinction.

## Context

- A show-level DiaryEntry (`season=NULL`) must exist before any season-level sub-entry can be created (PRD 5.3, story 6).
- Users can optionally log individual seasons as sub-entries. Season entries are linked via the `season` FK.
- Show-level status/rating is the user's overall take on the show. Season-level ratings are personal detail and excluded from community averages.
- Seasons may be added to a TV show incrementally — not all seasons need to exist at log time (PRD 5.2).

## Questions to resolve

- How does the media item page surface the show vs. season logging options? (tabbed, expandable section, separate buttons)
- What happens if the user tries to log a season without a show-level entry? (auto-create the show entry first, or block with a prompt)
- Where does season-level logging live in the UI? (sub-section under the show's diary entry, separate sheet, inline on the media page)
- How are seasons listed on a show's media item page? (numbered list, each with a "Log it" action)
- If the show has no seasons defined in the catalog yet, can the user add a season inline during logging, or must they edit the media item first?
- How is the show-level entry displayed in the diary relative to its season sub-entries? (parent-child indentation, flat with a label, separate sections)
