# Next.js as the full stack — no separate backend service

The entire application is TypeScript and Next.js. There is no separate backend API service (no Express, Fastify, tRPC server, or standalone REST/GraphQL layer).

Data fetching happens in Server Components via Prisma. Mutations happen through Server Actions. The Prisma client runs server-side within the Next.js process — never exposed to the client. This is sufficient for Median's access patterns: most pages are server-rendered reads, and mutations map cleanly to Server Actions with form validation via `zod`.

This decision follows directly from ADR-0004 (Prisma) and ADR-0005 (Next.js App Router). The full stack in one repo and one deploy target simplifies the development model: no separate API versioning, no cross-origin auth concerns, no extra infrastructure to manage.

**Considered alternatives:**

- **Separate Express/Fastify API**: Unnecessary complexity for this scale. Server Actions cover the mutation surface without a network hop.
- **tRPC**: Attractive type safety, but adds a layer that Server Actions already make redundant in an App Router project. Revisit if a native mobile client is added in a future phase.
- **GraphQL**: Over-engineered for a two-person initial user base. No client-driven query flexibility is needed here.

**Known trade-offs:**

- If a native mobile app is added in a future phase, a public API surface will be needed. Server Actions are not callable from outside Next.js. The path at that point is to extract shared business logic into service functions and add a route handler or tRPC layer on top — the Prisma schema and service layer carry over cleanly.
