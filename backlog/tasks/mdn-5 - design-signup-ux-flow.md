---
id: MDN-5
title: Design signup UX flow
status: To Do
assignee: []
created_date: '2026-05-31'
labels: [UX]
dependencies: []
---

## Description

Design the UX flow for creating a new Median account.

## Context

- Required fields: username, email, password (PRD 3, Auth story 1).
- On signup, a default Wishlist is automatically created for the user (PRD 5.4).
- Email is stored but not used in v1 — no confirmation email is sent.
- Username must be unique; it forms the basis of the public profile URL (`/@username`).

## Questions to resolve

- What are the username validation rules? (allowed characters, min/max length)
- What is the password policy? (min length, complexity requirements)
- How are duplicate username/email errors surfaced?
- Is there a post-signup onboarding step, or does the user land directly on the home dashboard?
- Should the signup form link to login?
