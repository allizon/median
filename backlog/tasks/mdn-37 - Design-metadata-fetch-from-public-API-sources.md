---
id: MDN-37
title: Design metadata fetch from public API sources
status: To Do
assignee: []
created_date: '2026-06-06 22:50'
updated_date: '2026-06-12 14:07'
labels:
  - design
  - catalog
  - api-integration
dependencies: []
priority: high
ordinal: 750
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The catalog currently relies entirely on hand-entered media data. Design the integration of a public metadata API (e.g. TMDB, Open Library, Google Books) so that when a user adds a movie or TV show, title/year/creator/poster can be auto-populated rather than typed.

## Questions to resolve

- Which API(s) to use? TMDB covers movies + TV well. Google Books/Open Library for books when that phase arrives.
- Where does the API fetch happen — at add-time (search the external API inline) vs. as an enrichment step after the item exists?
- Do we store the external ID on the Media row (already modelled as `externalId`) and re-fetch on demand, or cache all fields at import time?
- How do we handle disambiguation (same title, different years)?
- Auth/API key management: server-only env vars, no client exposure.

## Likely shape

1. Replace or augment the "Add new item" Sheet search with a live TMDB search — user picks from real results instead of typing everything.
2. Store `externalId` on creation so we can refresh metadata later.
3. Poster/image storage is a follow-on concern (CDN, Next Image optimisation).
<!-- SECTION:DESCRIPTION:END -->
