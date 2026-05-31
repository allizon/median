---
id: MDN-24
title: Design media item page UX
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31'
labels:
  - UX
dependencies:
  - MDN-6
  - MDN-9
priority: high
ordinal: 23000
---

## Description

Design the page for an individual media item — what it shows, how it's accessed, and what actions are available from it.

## Context

- PRD 3 (Media story 6): any visitor (including logged-out) can view a media item's page and see its community average rating.
- PRD 5.4: the "Log it" sheet is accessible from the media item's page (primary "Log it" button).
- PRD 5.4: "Add to Wishlist" and "Add to list…" are accessible from the media item's page.
- PRD 5.2: media items have title, year, creator, type. TV shows also have seasons.
- PRD 5.3: community average rating comes from show-level DiaryEntries where status=finished and rating is not null.
- TV shows have seasons (number + optional title) which can be logged individually as sub-entries.

## Questions to resolve

- What is the URL routing for media item pages? (e.g., `/media/[id]`, `/media/[id]/[slug]`, or type-prefixed like `/movies/[id]`)
- Does each media type (movie, TV show, book) get a meaningfully different page layout, or is it a single template with conditional sections?
- For TV shows: are seasons listed on the media page, and can the user log individual seasons from there?
- What metadata is shown on the page? (title, year, creator, type, community avg rating, number of ratings — what else?)
- Who can see what? (logged-out: title, rating; logged-in: + action buttons; any difference for friends?)
- What does the community rating display look like? (star display, count, no individual ratings shown per PRD 5.7)
- Is there a "currently logged by X users" or "X people have finished this" stat shown publicly?
- Where does the "Edit metadata" action live on this page? (inline, button, or admin-only)
