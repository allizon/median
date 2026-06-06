---
id: MDN-31
title: Design in-app notification system
status: To Do
assignee: []
created_date: '2026-06-06'
updated_date: '2026-06-06'
labels:
  - UX
  - notifications
  - collaborative-lists
dependencies:
  - MDN-15
  - MDN-16
ordinal: 40000
---

## Description

Design the in-app notification system required to make collaborative features usable. Without notifications, users have no way to discover that something has happened on a shared list.

## Context

In-app notifications are needed from day one. They are part of the UI, not an external communication channel. Email/push notifications are deferred to a later phase.

**Minimum notification events for the collaborative loop:**
- Someone added an item to a shared list you're on
- Someone scored an item on a shared list you're on
- Someone marked an item as watched on a shared list you're on ("X marked [title] as watched — did you watch it too?")
- You've been invited to a collaborative list (see MDN-15)

**Out of scope for v1:** Email delivery, push notifications, per-notification preference settings, notification history older than N days.

## Questions to resolve

- Where does the notification surface live? (bell icon in nav with unread badge, dedicated `/notifications` page, slide-over panel, inline toasts)
- What does each notification look like? (actor + action + object, e.g. "Sarah added Dune to Movie Night")
- Is there a persistent notification feed, or are notifications only surfaced as toasts at the moment they occur?
- How are notifications marked as read? (on open, on click, explicit mark-all-read)
- Does the unread count badge appear on the nav globally, or on the specific list?
- Should notifications be grouped (e.g. "3 things added to Movie Night") or always individual?
- What is the data model — a `Notification` table per user, or derived from activity events on the fly?
- How are notifications delivered in real time — polling, server-sent events, or only on page load/navigation?
