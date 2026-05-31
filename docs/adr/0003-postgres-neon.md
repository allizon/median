# Postgres (Neon) as the database

We use PostgreSQL hosted on [Neon](https://neon.tech) as the primary database.

Neon provides serverless Postgres with connection pooling, branching for development/staging environments, and a generous free tier — well-suited for a small-user-base app that needs to grow without a rewrite. It avoids the operational overhead of self-hosting Postgres while remaining standard Postgres under the hood (no proprietary extensions required).

Alternatives considered: SQLite (insufficient for multi-user concurrent writes and no hosted branching), PlanetScale/MySQL (less Postgres ecosystem compatibility), self-hosted Postgres (unnecessary operational overhead for this stage).
