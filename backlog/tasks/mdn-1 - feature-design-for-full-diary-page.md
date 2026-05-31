---
id: MDN-1
title: Feature design for full diary page
status: To Do
assignee: []
created_date: '2026-05-31 15:24'
labels: []
dependencies: []
ordinal: 1000
---

## Description

The full diary page (`/diary`) is linked from the "My Diary" widget on the home dashboard but has not yet been designed. This task covers the feature design before implementation begins.

## Context

- The home dashboard Widget 2 ("My Diary") shows the last ~5 entries and links to the full diary page.
- The PRD (section 5.3) specifies the diary view requirements: all entries paginated, filterable by status / media type / year finished / rating range, sortable by date added / date finished / rating / title.
- The full page is only accessible to the authenticated owner of the diary — it is not a public or friends-visible page.

## Design questions to resolve

- Layout: list view vs. grid/card view? Toggle between both?
- Entry row: what fields are shown inline vs. expanded on click?
- Filter/sort UI: sidebar, top bar, or inline controls?
- Pagination vs. infinite scroll?
- Does the full diary page also serve as the entry point for editing a DiaryEntry (inline or modal)?
- TV shows: how are season sub-entries displayed relative to the show-level entry?

## Reference

- PRD section 5.3 (Diary)
- PRD section 5.8 Widget 2 (entry point)
