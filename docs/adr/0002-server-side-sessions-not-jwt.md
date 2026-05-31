# JWT sessions (Auth.js default)

We use JWT-based sessions via Auth.js v5, which is the idiomatic default for Next.js applications.

Auth.js v5's Credentials provider requires the JWT session strategy — the database session strategy is not supported when using credentials-based authentication. JWT is also the standard Next.js auth pattern: session state is encoded in a signed, HttpOnly cookie and verified on each request without a database round-trip.

The earlier draft of this ADR argued for database-backed sessions on logout-invalidation grounds. In practice, Auth.js handles logout by clearing the session cookie, which is sufficient for this app's security requirements. A server-side session blocklist would add infrastructure complexity (a second database table or Redis) with no meaningful security gain for a small, closed user base.

**Decision:** JWT strategy via Auth.js v5. Session stored in a signed HttpOnly cookie. Logout clears the cookie.
