# Server-side sessions, not JWT

We use server-side sessions (database-backed or Redis) for authentication, not JWTs.

JWTs are stateless by design, which makes true logout impossible without maintaining a server-side blocklist — reintroducing the state you tried to avoid, with added complexity. For a personal diary app where users expect logout to mean logout, this is an unacceptable security trade-off.

The PRD left this open ("session-based or JWT — implementation choice"). JWT was introduced by an automated agent without a stated requirement or rationale. Server-side sessions are the correct default for a web-only, small-user-base app with no need for stateless token distribution across services.
