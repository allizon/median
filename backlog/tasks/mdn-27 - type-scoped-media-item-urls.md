---
id: MDN-27
title: Type-scoped media item URLs
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-06-12 14:07'
labels:
  - routing
  - media
dependencies: []
priority: low
ordinal: 28000
---

## Description

Replace the current `/media/[id]` route with type-scoped URLs that include the media type and a human-readable slug — e.g. `/movie/dune-2021`, `/tv/the-wire`, `/book/the-dispossessed`.

## Context

- Current route: `/media/[id]` — opaque CUID, not human-readable or shareable.
- Desired routes: `/movie/[slug]`, `/tv/[slug]`, `/book/[slug]`.
- Slug format: kebab-case title + optional year disambiguator (e.g. `dune-2021`).
- Slug needs to be unique within its type. Collision strategy TBD (append `-2`, `-3`, etc.).
- All existing internal links (`/media/${id}`) must be updated.
- The old `/media/[id]` route could redirect to the new URL for backwards compatibility (if needed).

## Questions to resolve

- Should the slug be stored as a DB column (generated at insert time) or derived on the fly from title + year?
- Collision handling: append `-2` / `-3` suffix, or use `title-year-id-suffix`?
- Route segment for TV shows: `/tv/` or `/tv-show/`?
- Should `/media/[id]` redirect permanently (308) to the type-scoped URL, or just be removed?
- Does the slug need to be mutable (e.g. when a title is corrected)?
