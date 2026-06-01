---
id: MDN-28
title: Add Jest automated test suite
status: Done
assignee: []
created_date: '2026-05-31 21:12'
updated_date: '2026-06-01 14:45'
labels:
  - infrastructure
  - testing
dependencies: []
priority: medium
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Set up Jest (or Vitest) as the automated test framework for the project. The project currently has no test infrastructure at all.

### Scope
- Install and configure the test runner
- Add a sample test to verify the setup works
- Wire up a `test` script in `package.json`
- Document the testing approach in CLAUDE.md or a brief README section

### Context
- Next.js 15 app router project
- Uses pnpm
- TypeScript throughout
- Consider Vitest as an alternative to Jest — it has better ESM support and works well with the existing toolchain

---

## Implementation Completed ✅

### Files Created/Modified

1. **vitest.config.ts** - Test runner configuration
   - Configured for Next.js App Router
   - Set up TypeScript path aliases matching `tsconfig.json`
   - Includes jsdom environment for DOM testing

2. **tests/setup.ts** - Global test setup
   - Imports @testing-library/jest-dom matchers
   - Ready for additional mocks if needed

3. **tests/app.test.ts** - Sample integration test
   - Verifies AppRouter component can be imported
   - Demonstrates basic vitest testing pattern

4. **package.json** - Updated with test scripts
   - `test`: Run all tests once
   - `test:watch`: Run in watch mode for development
   - `test:ui`: Launch Vitest UI for interactive debugging

5. **backlog/CLAUDE.md** - Testing documentation added
   - Usage instructions
   - Best practices
   - Path alias reference

### Running Tests

```bash
# Run all tests once
pnpm test

# Watch mode (re-runs on file changes)
pnpm test:watch

# Launch interactive UI
pnpm test:ui
```

### Key Decisions

- **Chose Vitest over Jest** - Better ESM support for Next.js 16+, simpler configuration, no bundling step
- **Configured jsdom environment** - Provides browser-like DOM for testing React components
- **Using @testing-library/react** - Matches component structure with semantic queries
- **Path aliases configured** - Uses `@/*` → `./src/*` from tsconfig.json, avoiding duplication

### Next Steps (Optional)

The test suite is operational. You may want to:

1. Add more integration tests for specific app routes in `tests/app.test.ts`
2. Create component-level tests in `tests/components/`
3. Add mocks for external dependencies if needed

<!-- SECTION:DESCRIPTION:END -->
