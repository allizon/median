---
id: MDN-11
title: Design companion tagging UX flow
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 17:28'
labels:
  - UX
  - media-logging
dependencies:
  - MDN-9
ordinal: 10000
---

## Description

Design the UX for tagging other registered users as companions ("watched/read with") on a diary entry.

## Context

- Companions are stored via the `DiaryEntryCompanion` join table — a many-to-many between DiaryEntry and User (PRD 4, DiaryEntry).
- No consent required or notifications sent in v1. Tagged users are not notified (PRD 5.3).
- Companion tags are a known privacy gap — consent + notifications are deferred to Phase 2.
- Companion data is never exposed publicly: not on public list pages, not to Anonymous Visitors (PRD 5.4).

## Questions to resolve

- Where in the "Log it" sheet does companion tagging live? (inline field, expandable section, always visible vs. hidden until needed)
- How does the user search for companions? (username typeahead, search input within the sheet)
- How are tagged companions displayed in the sheet before saving? (chip/pill per user, removable)
- How are companions displayed on a diary entry after saving? (e.g., "Watched with @alice, @bob" below the entry)
- Can companions be added or removed after the initial log, or only at log time?
- Should the field label be "Watched with" always, or adapt to media type? ("Read with" for books, "Watched with" for movies/TV)
