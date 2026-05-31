# Median — Product Requirements Document

**Version:** 0.2
**Date:** 2026-05-30
**Status:** Draft

> This document reflects decisions made during a structured design review of v0.1. See [CONTEXT.md](./CONTEXT.md) for the canonical domain glossary and [docs/adr/](./docs/adr/) for architectural decisions.

---

## 1. Overview & Goals

Median is a personal media diary and wishlist manager for movies, TV shows, and books. It lets users log what they've watched/read, track what they want to consume, and manage curated lists — alone or collaboratively with others.

The initial target is a small group of users (starting with two), but the architecture should support growth without needing a rewrite.

**Core goals:**

- Give users a single place to track media across types (movies, TV shows, books — extensible to more)
- Support the full lifecycle of media consumption: want it → logging it → done (or abandoned)
- Enable collaborative wishlists with lightweight voting, so pairs or groups can surface shared interests
- Keep it private by default; sharing is opt-in per list
- Allow community-level discovery (public lists, aggregate ratings) without becoming a social media site

---

## 2. Non-Goals

These are explicitly out of scope for v1:

- **No social feed.** No activity stream, no "X just finished Y" notifications, no timeline.
- **No public reviews or comments.** Notes are always private. No comment sections anywhere.
- **No pre-populated catalog.** The media database starts empty and grows as users add items.
- **No external API enrichment in v1.** The `external_id` field is reserved for future integration with TMDB, Open Library, etc., but no syncing happens yet.
- **No email functionality in v1.** Email addresses are stored but never used. No password reset emails, no invite emails, no notification digests. Email infrastructure is a future phase.
- **No notifications in v1.** In-app or push notifications are a phase 2 concern.
- **No mobile app in v1.** Responsive web only.
- **No import from Letterboxd, Goodreads, etc.** Possible future feature, not now.
- **No rewatches/re-reads in v1.** One DiaryEntry per user per media item (or per season). Rewatch history is phase 2.
- **No self-service password reset in v1.** Password recovery requires a manual database reset. Must be resolved before any wider launch beyond the initial cohort.
- **No public reviews or aggregate scores by critics.** Community averages only.

---

## 3. User Stories

### Authentication & Account

1. As a new user, I can sign up with a username, email, and password.
2. As a returning user, I can log in and access my data.
3. As a user, I can log out, immediately invalidating my session.
4. As a user, I can view and edit my profile (username, display name).
5. As a user, I have a shareable profile URL (`/users/:username`) that anyone can visit.

### Media Catalog

1. As a user, I can search the shared catalog by title, optionally filtered by media type.
2. As a user, I can add a new media item (movie, TV show, or book) to the catalog if it doesn't exist.
3. As a user, I can edit the metadata (title, year, creator) of any catalog item.
4. As a user adding a TV show, I can define seasons (number and optional title) for that show.
5. As a user, I can add seasons to a TV show incrementally as I log them.
6. As any visitor (including logged-out), I can view a media item's page and see its community average rating.

### Diary (Logging)

1. As a user, I can explicitly log a media item by opening the "Log it" sheet from the media item's page or from a list.
2. As a user logging an item, I can set a status: `in-progress`, `paused`, `abandoned`, or `finished`.
3. As a user, I can update the status of a diary entry as my consumption progresses.
4. As a user, I can rate a finished item on a 1–5 half-star scale (stored as integer 1–10).
5. As a user watching a TV show, I can log a show-level diary entry (overall status/rating) and optionally log individual seasons as separate sub-entries.
6. As a user, season diary entries require an existing show-level diary entry — I must log the show before logging a season.
7. As a user, I can write private notes on a diary entry. Notes are never visible to anyone else.
8. As a user, I can record a date when I finished something.
9. As a user, I can tag other registered users as companions ("watched/read with") on a diary entry.
10. As a user, I can view my full diary, filterable by status, media type, year finished, and rating range, and sortable by date added, date finished, rating, or title.

### Wishlist & Lists

1. As a new user, I automatically have a default Wishlist list created on signup.
2. As a user browsing search results, I can add an item directly to my Wishlist with one action ("Add to Wishlist").
3. As a user browsing search results, I can alternatively open a list picker to add an item to any of my lists.
4. As a user, I can create additional named lists beyond my default Wishlist.
5. As a user, I can set a list's visibility: private, friends-only, or public.
6. As a user, I can add media items to any of my lists.
7. As a user, I can remove items from my own lists.
8. As a user, I can copy individual items or all items from one list to another (duplicates silently skipped).
9. As a user, I can log a media item directly from a Wishlist entry ("Log it" shortcut on the list item).

### Collaborative Lists

1. As a user, I can invite another user (by username) to collaborate on one of my lists.
2. As an invited user, I can accept or decline the collaboration invite.
3. As a collaborator, I can add items to a shared list.
4. As a collaborator, I can upvote items on a shared list (one vote per item); I can toggle my vote off.
5. As a collaborator, I can see items ranked by vote count, with ties broken by the order they were added.
6. As a collaborator, I can "mark an item as done," which opens the "Log it" sheet pre-filled as `finished`, so I can optionally rate it and record a date before confirming.
7. As a collaborator, I can remove items I personally added to a shared list.
8. As a list owner, I can remove any item from the list (cascade-deletes all votes on that item).
9. As a list owner, I can remove a collaborator from the list.
10. As a collaborator (non-owner), I can leave a shared list. My votes and added-by attributions remain.
11. As a collaborator, I can copy items from a collaborative list to one of my personal lists.

### Friends & Discovery

1. As a user, I can search for other users by username.
2. As a user, I can visit another user's profile page at `/users/:username` and send them a friend request.
3. As a user, I can copy a shareable link to my own profile page.
4. As a user, I can accept or decline incoming friend requests.
5. As a user, I can remove a friend. Access to friends-only lists is revoked immediately.
6. As a user, I can view a friend's lists that are marked friends-only or public.
7. As a user, I can view a friend's diary entries, including their star ratings (but never their private notes).
8. As any visitor (logged-out or logged-in), I can browse public lists.
9. As any visitor, I can search for a media item and see its community average rating.

---

## 4. Data Model

### User

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| username | string, unique | |
| email | string, unique | Stored but not used in v1 — no email sending |
| password_hash | string | bcrypt or argon2 |
| display_name | string, nullable | |
| created_at | timestamp | |

**Relationships:**

- `friends`: self-referential many-to-many (symmetric, via `Friendship` join table with `status`: pending/accepted)

---

### Media

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| title | string | |
| year | integer, nullable | |
| creator | string, nullable | Director for movies, author for books, etc. |
| type | enum | `movie`, `tv_show`, `book` — extensible |
| external_id | string, nullable | Reserved for TMDB, Open Library, etc. |
| created_by | FK → User | Who first added this item |
| updated_by | FK → User, nullable | Last user to edit metadata |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### Season *(TV shows only)*

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| media | FK → Media | Must be `type=tv_show` |
| number | integer | Season number |
| title | string, nullable | e.g., "Part 2" |

---

### DiaryEntry

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| user | FK → User | |
| media | FK → Media | |
| season | FK → Season, nullable | For season-level TV sub-entries only |
| status | enum | `in-progress`, `paused`, `abandoned`, `finished` |
| rating | integer, nullable | 1–10 (represents 0.5–5.0 in half-star steps) |
| notes | text, nullable | Always private — never visible to anyone else |
| date_finished | date, nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Constraints:**

- `(user, media, season)` is unique — one entry per user per media item (or per season for TV). No rewatches in v1.
- For a season entry to exist, a show-level entry (`season=NULL`) for the same user+media must exist.
- `rating` is only meaningful when `status=finished` — enforced at app layer.

**Community average calculation:**

- Only show-level entries (`season=NULL`) where `status=finished` and `rating IS NOT NULL` contribute to the aggregate.
- Season-level ratings are personal detail and excluded from community averages.

**Watched/Read With:**

- `watched_with`: many-to-many to User via `DiaryEntryCompanion` join table.
- No consent required in v1. Known privacy gap — addressed alongside Phase 2 notifications.

---

### List

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| owner | FK → User | |
| name | string | |
| visibility | enum | `private`, `friends`, `public` |
| is_default_wishlist | boolean | True for the auto-created Wishlist; false otherwise |
| created_at | timestamp | |

**Relationships:**

- `members`: many-to-many to User via `ListMember` join table (owner is implicitly a member)

---

### ListItem

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| list | FK → List | |
| media | FK → Media | |
| added_by | FK → User | |
| added_at | timestamp | |

**Constraints:**

- `(list, media)` unique — a media item appears once per list.

---

### ListVote

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| list_item | FK → ListItem | |
| user | FK → User | |

**Constraints:**

- `(list_item, user)` unique — one vote per user per item.
- Cascade-deleted when the ListItem is deleted.

---

### Friendship

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| requester | FK → User | |
| addressee | FK → User | |
| status | enum | `pending`, `accepted` |
| created_at | timestamp | |

**Constraints:**

- `(requester, addressee)` unique.

---

## 5. Feature Spec

### 5.1 Authentication

Email/password auth only. Passwords hashed with bcrypt or argon2. **Server-side sessions** — not JWT (see [ADR-0002](./docs/adr/0002-server-side-sessions-not-jwt.md)). Sessions stored in a **Postgres table** (not Redis — Postgres via Neon is already the only required infrastructure; see [ADR-0003](./docs/adr/0003-postgres-neon.md), [ADR-0004](./docs/adr/0004-prisma-orm.md)).

No OAuth in v1. No email sending in v1 — password recovery requires a manual database reset. This is an accepted operational gap for the initial closed user base.

---

### 5.2 Media Catalog

**Search:** Full-text or ILIKE search on `title`. Filter by `type`. Return title, year, creator, type, community average rating.

**Add item:** Any logged-in user can add a media item. Required fields: title, type. Optional: year, creator. `external_id` stored but not exposed in UI.

**Edit item:** Any logged-in user can edit a media item's metadata (title, year, creator). Records `updated_by` and `updated_at` on save. No approval flow in v1.

**TV Seasons:** When adding or editing a `tv_show`, the user can add seasons (number + optional title). Seasons can be added incrementally.

**Deduplication:** No automated dedup in v1. Rely on search-before-add UX. Known rough edge — addressed in Phase 3 with external catalog enrichment.

---

### 5.3 Diary

**Creating a DiaryEntry ("Logging"):**

A DiaryEntry is created only by an explicit user action — the "Log it" sheet. It is never created automatically. The sheet is accessible from:

- The media item's page (primary "Log it" button)
- A Wishlist or list item (shortcut "Log it" action on list items)
- A collaborative list's "mark as done" action (pre-fills `status=finished`)

**Status lifecycle:**

```
in-progress → finished
            ↘ paused → in-progress (resume)
            ↘ abandoned
```

Status can be set directly to any value — no hard transition enforcement. This is a UX guide, not a system constraint.

**Rating:** Displayed as half-stars (0.5–5.0). Stored as integer 1–10. Null if unrated. Only meaningful for `finished` entries but not blocked for other statuses.

**TV show entries:**

- Log the show first (show-level entry, `season=NULL`). This is required before logging any season.
- Optionally log individual seasons as sub-entries linked via the `season` FK.
- Season entries cannot exist without a parent show-level entry.

**Notes:** Free text, always private, never visible to any other user, never aggregated.

**Companions:** "Watched/read with" links to other registered users. No consent required or notifications sent in v1. Tagged users are not notified.

**Date finished:** Optional date field. No time — just date.

**Rating visibility:**

- A user's star ratings are visible to accepted friends.
- Notes are always private to the owner.
- Community averages (show-level, finished entries only) are visible to everyone including Anonymous Visitors.

**Diary views:**

- All entries (paginated)
- Filter by: status, media type, year finished, rating range
- Sort by: date added, date finished, rating, title

---

### 5.4 Lists & Wishlist

**Default Wishlist:** Created automatically on user signup (`is_default_wishlist=true`). Cannot be deleted.

**Add-to-list flow from search:**

- Primary action: "Add to Wishlist" — one tap, adds directly to the default Wishlist.
- Secondary action: "Add to list…" — opens a picker to choose any list.

**Personal lists:** Users can create additional named lists beyond the Wishlist.

**Visibility:**

- `private`: owner and collaborators only
- `friends`: visible to accepted friends (and collaborators)
- `public`: visible to anyone, including Anonymous Visitors

**What's exposed on a public list page:** list name, owner username (not email), item count, each item's title/type/year/creator, and community average rating per item. No individual ratings, no notes, no companion data.

**List items:** Each item is a Media reference. Adding a duplicate is a no-op.

**Copy operations:**

- Copy one item from list A to list B, or copy all items.
- Works in any direction (personal ↔ personal, collaborative ↔ personal).
- Duplicate items silently skipped.

**List display:** Show title, type, year, creator. For collaborative lists, additionally show vote count and who added the item.

---

### 5.5 Collaborative Lists

**Making a list collaborative:** The owner invites another user by username. Accepted invite → they become a `ListMember`.

**Member permissions:**

- Any member can add items
- Any member can upvote (once per item); voting is toggleable
- Any member can "mark an item as done" (opens the shared "Log it" sheet pre-filled as `finished`)
- Any member can remove items they personally added
- Owner can remove any item (cascade-deletes all votes on that item — known rough edge)
- Only the owner can remove members or delete the list

**Voting:** Items sorted by vote count descending by default; ties broken by `added_at` ascending.

**Mark as done:** Opens the "Log it" sheet with `status=finished` pre-filled. User can optionally set a rating and date finished before confirming. Creates a DiaryEntry (or updates status to `finished` if one already exists). Does not remove the item from the list.

**Leaving a list:** A non-owner member can leave. Their votes and `added_by` records remain (soft attribution).

---

### 5.6 Friends

**Finding users:**

- Search by exact or partial username
- Visit a profile at `/users/:username` directly
- Share your own profile link via the copy-link button on your profile page

**Friend request flow:**

1. User A visits User B's profile and clicks "Send friend request"
2. User B sees the pending request and accepts or declines
3. On accept: each can see the other's friends-only lists and star ratings

**No invite-by-email in v1.** Share your profile URL out-of-band if the target user isn't registered.

**Friend visibility:** Friendship is symmetric. Accepted friends can see each other's:

- Friends-only lists
- Star ratings on diary entries (not notes)

**Removing a friend:** Either user can remove the friendship. Access to friends-only content is revoked immediately.

---

### 5.7 Discovery

**Browse public lists:** Paginated feed of public lists, sorted by most recently updated. Accessible to Anonymous Visitors. Shows list name, owner username, item count.

**Community ratings:** On a media item's page:

- Average rating from show-level DiaryEntries (`season=NULL`) where `status=finished` and `rating IS NOT NULL`
- Number of ratings
- No individual ratings shown — aggregate only

**Search results enrichment:** Media search results show community average rating inline.

---

### 5.8 Home Dashboard (`/`)

The home dashboard is the logged-in user's primary workspace. It is private — only visible to the authenticated user. Unauthenticated users hitting `/` are redirected to `/login`.

**Layout:** Widget/card grid. Four widgets displayed simultaneously.

#### Widget 1 — Log Something
- Prominent "Log something" button at the top of the page
- Opens a modal with this flow: search catalog by title → select from results (or add new media item if not found) → choose status → optional rating and notes → save
- Creates a new DiaryEntry or updates an existing one

#### Widget 2 — My Diary (recent entries)
- Shows the last ~5 diary entries across all statuses
- Each entry shows: media title, media type, status badge, rating (if finished)
- Link to full diary page

#### Widget 3 — My Lists
- Shows all the user's lists (personal and collaborative) as cards
- Each card: list name, item count, visibility badge, collaborator count (if collaborative)
- "New list" button
- Each card links to that list's page

#### Widget 4 — Recent Collaborative Activity
- Flat chronological feed of the last ~10 events across all collaborative lists the user is a member of
- Event types:
  - "[Username] added [Media Title] to [List Name]"
  - "[Username] voted on [Media Title] in [List Name]"
  - "[Username] marked [Media Title] as done in [List Name]"
- Each event links to the relevant list
- Events are derived from existing data (ListItem.createdAt, ListVote timestamps, DiaryEntry.updatedAt) — no separate activity log table in v1

#### Widget 5 — Up Next
- In v1: pulls top items from the user's default wishlist, ordered by date added
- Shows 3–5 items: media title, type
- Configurable source (choose which list(s) to pull from) is deferred to a later phase

---

### 5.9 Public Profile (`/@username`)

The public profile is visible to any authenticated user. Logged-out access is TBD (see Open Question #1).

#### Header
- Username and display name
- Member since date
- If viewer is a different user: Friend button with states (Add Friend / Request Pending / Friends / Remove Friend)
- If viewer is the profile owner: link to Settings

#### Stats Bar
- Total finished by type: "X movies · Y TV shows · Z books"
- Average rating given: mean of all non-null ratings on finished DiaryEntries
- Currently in progress: hidden by default; user can opt in via a global profile setting (`showInProgressOnProfile`, default false). When enabled, shows current in-progress items.

#### Featured Lists
- The profile owner selects which lists to pin to their profile (via Settings)
- Only lists with `public` or `friends` visibility can be featured (friends-only lists are only shown to accepted friends viewing the profile)
- Each card shows: list name, item count, first 3 media titles
- Order is user-controlled (position field)

**No comments, no activity feed, no reviews** — intentionally minimal.

#### Schema additions required
- `User.showInProgressOnProfile` — boolean, default false
- `List.featuredOnProfile` — boolean, default false
- `List.profilePosition` — integer nullable (ordering of featured lists on profile)

#### URL Structure
- Home dashboard: `/`
- Public profile: `/@[username]`
- Settings: `/settings`

---

## 6. Phasing

### v1 — Core Product

- Auth (signup, login, logout — server-side sessions)
- Media catalog (search, add, edit, TV seasons)
- Diary (log it, all statuses, ratings, notes, companions, date finished)
- Wishlist and personal lists (create, manage, visibility, copy, add-to-wishlist shortcut)
- Collaborative lists (invite by username, add items, vote, mark done)
- Friends (search by username, profile page with shareable link, request/accept flow, friend rating visibility)
- Discovery (browse public lists, community ratings on media pages and search results)

### Phase 2 — Notifications & Companion Consent

- Notify when a collaborative list item is marked as done
- Notify when a friend request is received
- Notify when tagged as a companion on a diary entry
- Companion opt-in/opt-out (required alongside companion notifications)
- Delivery: in-app notification bell

### Phase 3 — External Catalog Enrichment

- Integrate TMDB for movies/TV: auto-populate title, year, director, poster art
- Integrate Open Library or Google Books for books
- Use `external_id` to link and sync metadata
- Deduplicate catalog entries that refer to the same external entity

### Phase 4 — Email Infrastructure

- Password reset via email
- Friend invite by email (send invite to a non-registered address)
- Optional notification digests by email

### Phase 5 — Import / Export

- Import from Letterboxd (movies/TV)
- Import from Goodreads (books)
- Export diary as CSV or JSON

### Phase 6 — Extended Media Types

- Podcasts, music albums, video games
- The `type` enum is designed to accommodate this without structural changes

### Phase 7 — Rewatch / Re-read History

- Allow multiple DiaryEntries per user per media item
- Track rewatch count, per-watch ratings, dates
- Clarify which rating counts toward community averages

---

## 7. Open Questions

All open questions from v0.1 have been resolved. Resolutions are recorded in [CONTEXT.md](./CONTEXT.md). Summary:

1. **Logged-out public list access** → Allowed in v1.
2. **Default wishlist add flow** → Primary "Add to Wishlist" + secondary "Add to list…" picker.
3. **"Mark as done" rating prompt** → Opens the shared "Log it" sheet pre-filled as `finished`.
4. **Catalog editing permissions** → Any logged-in user can edit; `updated_by` logged.
5. **Duplicate catalog entries** → Deferred to Phase 3. Known rough edge.
6. **Collaborative list item removal cascade** → Owner can remove any item; votes cascade-delete. Accepted rough edge.
7. **Friend rating visibility** → Friends can see star ratings; notes always private.
8. **Password reset** → No self-service in v1. Manual reset only. Required before wider launch.
