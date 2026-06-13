# Median - CLAUDE.md

## Issue Tracking

All issues are stored as Github issues. Use Github's standard issue numbering (no `MDN-` prefix) for new issues. See <https://github.com/allizon/median/issues>.

## Testing with Vitest

This project uses **Vitest** as its test runner, configured for Next.js App Router.

### Running Tests

- Run all tests: `pnpm test`
- Watch mode: `pnpm test:watch`
- With UI: `pnpm test:ui`

### Test File Structure

```
tests/
├── app.test.ts          # Integration tests for app routes
├── components/         # Component tests
│   └── .gitkeep
└── setup.ts            # Global test setup (vitest imports, mocks)
```

### Path Aliases

The vitest config uses the same TypeScript path aliases as `tsconfig.json`:

- `@/*` → `./src/*`

### Best Practices

1. Use `vitest` over `jest` - Vitest has better ESM support for Next.js 16+
2. Keep tests in a dedicated `tests/` directory for easy discovery
3. Use the `setup.ts` file for global test configuration
4. Prefer integration tests that verify component interaction via testing-library

## Architecture Patterns

### Server / client component split

- Route pages (`page.tsx`) are always `async` server components — they call `auth()`, query Prisma directly, and pass typed data to children as props.
- Interactive children live in `"use client"` files alongside or under the page (e.g. `list-detail.tsx`).
- Small interactive islands (buttons that open Sheets, widget state) are extracted into dedicated client components so the rest of the page stays server-rendered.

### Server actions

All mutations live in `src/lib/actions/` as `"use server"` files. Conventions:

- Auth check first (`auth()` → early return if no session).
- Zod validation before any DB work.
- Ownership verified via Prisma `where: { id, ownerId: session.user.id }` — never trust the client.
- Return a tagged union `{ status: "..." }` — never throw from an action.
- Call `revalidatePath(...)` after mutations that affect server-rendered pages.

### Optimistic removals with undo toast

The list detail page and wishlist widget use a deferred-delete pattern: hide item immediately in UI state, schedule the actual `removeListItem` call after 5 seconds (`UNDO_DELAY_MS`), and show an undo toast. If the user clicks Undo, `clearTimeout` cancels the call and the item is restored. This avoids needing a restore/re-add server action.

### Toast infrastructure

`toastManager` is a singleton from `src/lib/toast.ts`. Call `toastManager.add({ title, actionProps? })` from any client component. To add an undo/action button, pass `actionProps: { children: "Undo", onClick: handler }`.

### UI primitives

- **Sheet** (`src/components/ui/sheet.tsx`): built on `@base-ui/react/dialog`. Always controlled (`open` / `onOpenChange`). State resets via `useEffect(() => { ... }, [open])`.
- **Button** (`src/components/ui/button.tsx`): CVA variants — `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`. Sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.
- No shadcn. Uses `@base-ui/react` primitives throughout.

### Visibility options

Lists use `private` / `public` only (the `friends` enum value exists in the schema but is deferred — do not expose it in UI).

### Books / media types

Books are deferred to a later phase. Only `movie` and `tv_show` are exposed in the UI. The `book` enum value exists in the DB but must not appear in search filters, add-media forms, or type label maps.
