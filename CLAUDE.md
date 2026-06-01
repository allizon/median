# Median - CLAUDE.md

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

## Backlog.md Task Management

Read the `backlog/CLAUDE.md` file for instructions on managing tasks for this project using Backlog.md ([Github repo](https://github.com/MrLesk/Backlog.md/)).
