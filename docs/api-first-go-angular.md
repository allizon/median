# API-first Go + Angular implementation — architecture discussion

> **Status:** exploring / planning. This is a **separate, parallel implementation** of the Median
> concept. It does **not** replace or migrate the existing Next.js app — that stays untouched.

## Why this exists

- **Primary driver:** curiosity / skill-building, plus a **dry-run for a likely work migration**
  from Ruby on Rails to a similar API-first stack. We want to learn whether this architecture
  holds up before proposing it at work.
- The existing Next.js full-stack app (ADR-0005, ADR-0006) is left alone. We build a clean-slate
  implementation of the same concept alongside it.
- This means the decisions that matter most are the ones that **generalize** (Go API shape, auth
  boundary, Docker packaging) — not those tied to Median's legacy internals.

## Decisions made (this session)

| Topic | Decision | Rationale |
|---|---|---|
| Repo | Same git repo, new top-level dir `/go-angular` | Keep `CONTEXT.md`, ADRs, agent conventions in reach |
| Scope (v1) | **Vertical slice** end-to-end | Validate every layer cheaply; not full parity |
| Packaging | **Single Docker image**, split-later path | Same-origin, no CORS; documented as 2 images later |
| Auth | **Access JWT (in memory) + refresh token in HttpOnly cookie** | Same-origin today, cross-origin/mobile-ready later |
| API shape | **REST/JSON** (pragmatic endpoints) | Natural for Go, least surprising, portable |
| DB | **PostgreSQL** | Representative (matches work + Median Neon); not throwaway |
| DB access | **sqlc** (type-safe SQL codegen) | Real SQL as source of truth, idiomatic Go |
| Web framework | **chi** (over net/http) | Minimal, idiomatic, middleware ergonomics, no framework lock-in |
| Migrations | **golang-migrate** | Versioned SQL files, fits sqlc, embeddable |
| Config | **Env vars + godotenv** (local) | 12-factor, no config framework |

## Out of scope / deferred (for now)

- **Full feature parity** (lists beyond wishlist, diary/log, ratings, friends, collaborators,
  community averages). The slice intentionally excludes these.
- **Splitting into two Docker images** / cross-origin CORS — see "Split path" below.
- Angular framework specifics (NgRx vs signals) — defaults proposed below, revisit on next pass.

## Defaults assumed (not yet grilled — revisit)

These were held out of the core grilling as sensible defaults. Flag if any is wrong.

- **Repo layout:** `/go-angular` is the top-level root for this build; the Go module lives at
  `/go-angular/backend`, the Angular app at `/go-angular/web`. Existing Next.js app stays where
  it is.
- **Angular:** modern standalone components (default since v17), **signals** for state, Angular
  `HttpClient` with typed REST calls. No NgRx for the slice.
- **TMDB:** Go-side `net/http` client using the Bearer token (`TMDB_API_KEY`), never exposed to
  the client — mirrors how the Next.js app does it (`src/lib/tmdb.ts`).
- **Pragmatic REST:** endpoints shaped to serve the UI (e.g. `GET /api/wishlist`) rather than
  strict CRUD resource modeling. REST/JSON at the protocol level.
- **Testing:** Go stdlib `testing` + `net/http/httptest` for handler tests; `testcontainers-go`
  for Postgres integration tests (deferred if friction). Angular: vitest/Karma as standard.
- **Domain language:** reuse the existing `CONTEXT.md` glossary (**List**, **Wishlist**,
  **ListItem**, **DiaryEntry**, **Media Picker**, **Anonymous Visitor**, visibility modes). The
  slice needs a subset: **User**, **Auth**, **List/Wishlist**, **ListItem**, **Media**, **TMDB**.

## Architecture overview

```
┌──────────────────────────────────────────────────────────────┐
│                 Single Docker image (prototype)              │
│                                                              │
│  ┌────────────────────────────┐   ┌───────────────────────┐  │
│  │        Angular SPA         │   │      Go binary        │  │
│  │   (/go-angular/web)        │   │  chi + sqlc + TMDB    │  │
│  │                            │   │                       │  │
│  │  Bearer access JWT in      │──▶│  REST/JSON API        │  │
│  │  memory; refresh via       │◀──│  under /api/*         │  │
│  │  HttpOnly cookie           │   │                       │  │
│  └────────────────────────────┘   │  · serves /web static │  │
│        served by Go (embed.FS)    │    via embed.FS       │  │
│                                   └───────────┬───────────┘  │
└───────────────────────────────────────────────┼──────────────┘
                                                │
                                    ┌───────────▼──────────┐
                                    │   PostgreSQL (Neon   │
                                    │   in dev/container)  │
                                    └──────────────────────┘
```

- **Same-origin** in the single image: Angular static served by Go at `/`, API at `/api/*`. No
  CORS in the prototype.
- **Auth flow (JWT + refresh cookie):**
  1. `POST /api/auth/login` validates credentials, returns a short-lived **access JWT** in the
     response body and sets a **refresh token** in an `HttpOnly; Secure; SameSite=Lax` cookie.
  2. Angular keeps the access JWT **in memory** and sends `Authorization: Bearer <token>`.
  3. On `401`, Angular calls `POST /api/auth/refresh`; the refresh cookie re-issues a new access
     JWT. No localStorage storage of tokens (avoids the XSS surface).

## Vertical slice (the thing we'll prove)

One end-to-end thread that touches every layer:

> Auth (signup/login) → TMDB search → add a title to **Wishlist** → view **Wishlist** →
> make/see a **Public List** viewable by an **Anonymous Visitor**.

Why it's the right slice: it exercises the Go auth boundary, Go↔TMDB server-side call,
persistence (Postgres/sqlc), the REST API shape, Angular auth handling, the public-vs-private
access check, and Docker packaging — in a single pass, without building the whole app.

### Data model for the slice

- **User** (id, username, password_hash; email stored but unused — per `CONTEXT.md`)
- **List** (id, owner_id, name, visibility: `private|public` — `friends` deferred per `CONTEXT.md`)
- **ListItem** (id, list_id, media_id, added_by)
- **Media** (id, tmdb_id, type: `movie|tv_show`, title, year, creator)
- **Auth token / refresh** (handled out-of-table via signed JWT + refresh secret, or a refresh
  token table — decide on next pass)

## Split path (the documented "later")

Nothing about the prototype prevents splitting later:

1. Build a second image: Nginx (or `caddy`) serving the Angular `dist/`.
2. Point the API image to serve `/api/*` only.
3. Enable **CORS** for the frontend origin and flip the refresh cookie to
   `SameSite=None; Secure` for cross-site use.
4. The auth model (access JWT + refresh cookie) already supports this — validation for this is
   precisely why we chose it.

## Relationship to existing docs

- **Does NOT deprecate ADR-0006.** That ADR describes the Next.js app, which we keep. This is a
  separate implementation. When/if the Next.js app is retired, revisit then.
- Reuses the `CONTEXT.md` glossary; `friends` visibility and diary-related terms are out of
  slice scope.

## Project tracking

Tracked in the `allizon/median` GitHub issue tracker (coexists with the Next.js app's issues),
isolated by the **`go-angular`** label and the **"Go/Angular reimplementation"** milestone.

| Slice | Issue | Title | Blocked by |
|---|---|---|---|
| A | #82 | Scaffold Go + Angular into a single-image Docker skeleton | — |
| B | #83 | Auth: signup, login, refresh (access JWT + HttpOnly refresh cookie) | #82 |
| C | #84 | Media + TMDB search (server-side) | #82 |
| D | #85 | Wishlist: add + view (default personal List) | #83, #84 |
| E | #86 | Public List viewable logged-out (Anonymous Visitor) | #85 |

A GitHub Project board visualizes the slice flow:
https://github.com/users/allizon/projects/5 (issues #82–#86).

## Open questions / next steps

- Refresh token storage: stateless (signed JWT, no table) vs. DB-backed refresh-token table
  (revocable). Decide before building auth.
- Password hashing: bcrypt (`golang.org/x/crypto/bcrypt`) — assume yes unless challenged.
- Angular version: latest stable (v20+) with standalone components and signals.
- Confirm the repo layout directories and whether the Go module root lives at
  `/go-angular/backend` or `/go-angular/backend/cmd/...` (standard: Go module at
  `/go-angular/backend`, `cmd/server/main.go`).
- Ground the layout, then scaffold: `go mod init`, sqlc + golang-migrate setup, Angular CLI
  workspace under `/go-angular/web`.
- This doc is the handoff point for future agent sessions.
