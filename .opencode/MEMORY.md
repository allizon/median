# Memory

## Branching policy (2026-06-18)

- **Code changes** (`.ts`, `.tsx`, `.js`, `.css`, config files, etc.) → create a feature/fix branch, push branch, PR to `main`. Never push code changes directly to `main`.
- **Documentation / markdown only** (`.md`, docs, comments) → can push directly to `main`.

## TDD preference

Use red-green-refactor when implementing features or fixing bugs. Test first, then implement, then verify.

## Issue discipline

When closing a GitHub issue, always add a comment summarizing the fix and referencing the commit(s).

## Commit checklist

Before every commit, run:
- `git status` — verify the right files are staged, no unexpected files included
- `git diff --cached` — verify each change is intentional and complete

This prevents silent failures (e.g., a file rename that only deletes the old file but never commits the new one).

## Recent work

- 2026-06-18: Implemented #37 — dashboard wishlist button opens modal instead of navigating to /search
