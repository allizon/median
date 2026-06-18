# Memory

## Branching policy (2026-06-18)

- **Code changes** (`.ts`, `.tsx`, `.js`, `.css`, config files, etc.) → create a feature/fix branch, push branch, PR to `main`. Never push code changes directly to `main`.
- **Documentation / markdown only** (`.md`, docs, comments) → can push directly to `main`.

## TDD preference

Use red-green-refactor when implementing features or fixing bugs. Test first, then implement, then verify.

## Issue discipline

When closing a GitHub issue, always add a comment summarizing the fix and referencing the commit(s).

## Recent work

- 2026-06-18: Implemented #37 — dashboard wishlist button opens modal instead of navigating to /search
