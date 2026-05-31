# Prisma as the ORM

We use [Prisma](https://www.prisma.io) as the ORM for all database access.

Prisma provides a type-safe query client generated from a schema file, first-class TypeScript support, and a migration workflow that integrates cleanly with Postgres. For a project where the data model is the core of the product, Prisma's schema-as-source-of-truth approach reduces drift between the data model and the code.

**Prisma vs Drizzle in detail:**

| | Prisma | Drizzle |
|---|---|---|
| Schema source of truth | Dedicated `.prisma` schema file | TypeScript schema definitions |
| Migration tooling | Mature, reliable | Less mature — more footguns |
| Relational query API | Battle-tested, excellent nested writes | Newer, less tested |
| Runtime weight | ~25MB (matters for edge/serverless cold starts) | Much lighter |
| Generated SQL | Less predictable | Predictable, SQL-first |
| Community / docs | Large, well-documented | Smaller |

Drizzle would be the better choice if routes were deployed on Vercel Edge or Cloudflare Workers, where cold-start weight is a hard constraint. Median is a traditional web app with no edge deployment requirement, so Prisma's migration reliability and mature relational query API outweigh Drizzle's runtime advantages.

Other alternatives considered: raw SQL with a query builder (more control, but more boilerplate and no type safety without manual effort), Kysely (type-safe but requires manual schema maintenance).

**Implication for sessions:** Since Prisma and Postgres are already in the stack, sessions are stored in a Postgres table rather than Redis. This avoids introducing a second infrastructure dependency (Redis) for the sole purpose of session storage. See [ADR-0002](./0002-server-side-sessions-not-jwt.md).
