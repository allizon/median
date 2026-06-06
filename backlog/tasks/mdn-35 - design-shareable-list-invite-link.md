---
id: MDN-35
title: Design shareable list invite link flow
status: To Do
assignee: []
created_date: '2026-06-06'
updated_date: '2026-06-06'
labels:
  - UX
  - collaborative-lists
dependencies:
  - MDN-15
  - MDN-33
ordinal: 44000
---

## Description

Design the flow for inviting someone to a collaborative list via a shareable link — the primary onboarding path for new users who are invited by someone they know.

## Context

Username-based invites (MDN-15) require the invitee to already have an account. Shareable links remove that barrier: the list owner generates a link, sends it out of band (text, email, etc.), and the recipient follows it to join — creating an account if they don't have one yet.

This is the most natural onboarding path for the initial use case (e.g. one partner invites the other). The landing page (MDN-33) should handle the invited-user arrival case, showing context like "X invited you to [list name]" rather than a generic sign-up screen.

Invite links should be scoped to a specific list, not a general "follow me" link.

## Questions to resolve

- How does the owner generate the link? (Button on the list page, in list settings, alongside the username invite input)
- Is the link single-use or reusable? Does it expire?
- What does the recipient see when they follow the link while logged out? (Landing page with list name + owner + "Join this list" CTA, sign up / log in options)
- What does the recipient see when they follow the link while already logged in? (Direct accept/decline prompt)
- After signing up via invite link, where does the user land? (Directly on the shared list — not a blank dashboard)
- Can the owner revoke a link after sharing it?
- Should there be a separate link per invitee, or one universal link for the list that anyone with it can join?
- How does this interact with list visibility settings — can a private list have a shareable invite link?

## Reference

- MDN-15 (username-based invite — the in-app complement to this flow)
- MDN-33 (landing page — must handle the invite arrival case)
- MDN-34 (dashboard — post-signup landing destination)
- docs/user-flows.md (Flow 6: receiving and accepting a list invite)
