# Testing with Vitest

This project uses **Vitest** as its test runner, configured for Next.js App Router and TypeScript.

## Getting Started

### Running Tests

```bash
# Run all tests once
pnpm test

# Watch mode (re-runs on file changes)
pnpm test:watch

# Launch interactive UI with test results
pnpm test:ui
```

## Project Structure

```
tests/
├── app.test.ts          # Integration tests for app routes
├── components/         # Component unit tests
│   └── .gitkeep
└── setup.ts            # Global test configuration
```

## Configuration

The project is configured to use:
- **jsdom** environment - Provides a browser-like DOM for testing React components
- **TypeScript path aliases** - Uses the same `@/*` → `./src/*` aliases as `tsconfig.json`
- **@testing-library/jest-dom** matchers - For semantic DOM queries and assertions

## Writing Tests

### Component Testing Example

```typescript
// tests/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import Button from '@/components/ui/button';

describe('Button', () => {
  it('renders with the correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
});
```

### Integration Testing Example

```typescript
// tests/app.test.ts
import { describe, expect, it } from 'vitest';

describe('App Routes', () => {
  it('should have correct title', () => {
    // Your integration test here
    expect(true).toBe(true);
  });
});
```

## Best Practices

1. **Test file placement** - Keep tests in `tests/` directory for easy discovery
2. **Setup file** - Use `setup.ts` for global configuration and mocks
3. **Path aliases** - Use `@/*` to import from `src/` (same as tsconfig.json)
4. **Naming convention** - Name test files with `.test.{ts|tsx}` extension
5. **Async operations** - Vitest handles async/await natively; use `it()` or `test()` for sync, `it.async()` or `test().for` for async

## Mocking Dependencies

Use Vite's built-in mocking:

```typescript
// In tests/setup.ts
vi.mock('@/some/module');
```

See [Vitest Mocks documentation](https://vitest.dev/guide/mocking.html) for more details.

## Coverage

To generate test coverage:

```bash
pnpm exec vitest run --coverage
```

Coverage report will be generated in the `coverage/` directory.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [jsdom Documentation](https://github.com/jsdom/jsdom)
