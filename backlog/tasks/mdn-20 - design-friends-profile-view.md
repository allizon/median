---
id: MDN-20
title: Design friend's profile view
status: To Do
assignee: []
created_date: '2026-05-31'
labels: [UX, friends]
dependencies: [MDN-18]
---

## Description

Design what an accepted friend sees when visiting another user's profile — specifically the friends-only lists and diary entries with star ratings but no private notes.

## Context

- Accepted friends can see each other's friends-only lists and star ratings on diary entries (PRD 5.6).
- Notes are always private to the owner — never visible to anyone else, including friends (PRD 5.3).
- The public profile (PRD 5.9) defines the base layout (header, stats bar, featured lists). The friend view adds access to friends-only content on top of this.
- Community averages are visible to everyone; personal ratings are only visible to friends (PRD 5.3).

## Questions to resolve

- Is there a separate "friend view" of the profile, or does the public profile page conditionally reveal more content when the viewer is a friend?
- How are friends-only lists surfaced on the profile? (mixed into the featured lists section with a visibility badge, or a separate section)
- Is there a `/users/:username/diary` page, or is diary content shown on the profile page itself?
- How are diary entries displayed to a friend? (list of finished items with star ratings, all statuses, etc.)
- How does the view degrade when the viewer is not a friend — are friends-only sections hidden, or shown with a "Friends only" lock state?
- If the viewer removes the friend while on this page, does the content immediately disappear?
