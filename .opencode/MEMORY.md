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
- `pnpm build` — catches TypeScript errors that lint doesn't flag (e.g., Prisma literal type widening)
- `pnpm lint` — catches style/rule violations
- `pnpm test` — catches runtime regressions
- `git status` — verify the right files are staged, no unexpected files included
- `git diff --cached` — verify each change is intentional and complete

This prevents silent failures (e.g., a file rename that only deletes the old file but never commits the new one).

## TypeScript annotations

Always add explicit type annotations. Never leave `let x;` without a type — TypeScript infers `any` when the assignment is inside a `try` block or otherwise conditional. Import the type and annotate: `let x: SomeType;`.

## TypeScript gotchas

- **Prisma `where` objects**: when extracted to a variable, `mode: "insensitive"` gets widened from `"insensitive"` (literal) to `string`. The inline form in `findMany({ where: { title: { contains: query, mode: "insensitive" } } })` preserves the literal via contextual typing; extracted variables need `as const` on the mode property to keep the build green.

## Recent work

- 2026-06-18: Implemented #37 — dashboard wishlist button opens modal instead of navigating to /search
- 2026-06-18: Fix #53 — wrapped Prisma calls in try/catch, but missed adding `Media` type annotation on `let media;` causing a build error. Fixed by importing `type Media` from `@prisma/client`.
