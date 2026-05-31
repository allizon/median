---
id: MDN-4
title: Design login UX flow
status: To Do
assignee: []
created_date: '2026-05-31'
updated_date: '2026-05-31 17:28'
labels:
  - UX
dependencies: []
ordinal: 3000
---

## Description

Design the UX flow for logging in to Median.

## Context

- Auth is email/password only — no OAuth in v1 (PRD 5.1).
- On successful login, the user is redirected to the home dashboard (`/`).
- No "forgot password" link in v1 — password recovery is a manual database reset. The login form should not imply self-service recovery.
- Server-side sessions — no JWT (ADR-0002).

## Questions to resolve

- Where does the login page live? (`/login`)
- What happens on failed login? (generic error vs. specific feedback)
- Should there be a "remember me" option, or is session persistence always on?
- What does the unauthenticated redirect experience look like? (e.g., returning to the intended page after login)
- How does the login page link to signup?
