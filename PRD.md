# Median — Product Requirements Document

**Version:** 0.1  
**Date:** 2026-05-31  
**Status:** Draft

---

## 1. Overview & Goals

Median is a personal media diary and wishlist manager for movies, TV shows, and books. It lets users log what they've watched/read, track what they want to consume, and manage curated lists — alone or collaboratively with others.

The initial target is a small group of users (starting with two), but the architecture should support growth without needing a rewrite.

**Core goals:**

- Give users a single place to track media across types (movies, TV, books — extensible to more)
- Support the full lifecycle of media consumption: want it → watching/reading → done (or abandoned)
- Enable collaborative wishlists with lightweight voting, so pairs or groups can surface shared interests
- Keep it private by default; sharing is opt-in per list
- Allow community-level discovery (public lists, aggregate ratings) without becoming a social media site

---

## 2. Non-Goals

These are explicitly out of scope, at least for v1:

- **No social feed.** No activity stream, no "X just finished Y" notifications, no timeline.
- **No public reviews or comments.** Notes are always private. No comment sections anywhere.
- **No pre-populated catalog.** The media database starts empty and grows as users add items.
- **No external API enrichment in v1.** The `external_id` field is reserved for future integration with TMDB, Open Library, etc., but no syncing happens yet.
- **No notifications in v1.** Email/push notifications are a phase 2 concern.
- **No mobile app in v1.** Responsive web only.
- **No import from Letterboxd, Goodreads, etc.** Possible future feature, not now.
- **No public reviews or aggregate scores by critics.** Community averages only (from diary entries of users who finished the item).

---

## 3. User Stories

### Authentication & Account

- As a new user, I can sign up with a username, email, and password.
- As a returning user, I can log in and access my data.
- As a user, I can view and edit my profile (username, display name).

### Media Catalog

- As a user, I can search the shared catalog by title.
- As a user, I can add a new media item (movie, TV show, or book) to the catalog if it doesn't exist yet.
- As a user adding a TV show, I can define seasons for that show.

### Diary

- As a user, I can add a media item to my diary with a status (wishlist, in-progress, paused, abandoned, finished).
- As a user, I can update the status of a diary entry as my consumption progresses.
- As a user, I can rate a finished item on a 1–5 half-star scale.
- As a user watching a TV show, I can log and rate individual seasons separately.
- As a user, I can write private notes on a diary entry.
- As a user, I can record a date when I finished something.
- As a user, I can note which other users I watched/read something with.
- As a user, I can view my full diary, filterable by status, type, and rating.

### Lists

- As a user, I can create named lists (e.g., "2025 Reading Challenge", "Cozy Movie Night").
- As a user, I can set a list's visibility to private, friends-only, or public.
- As a user, I can add media items to a list.
- As a user, I can remove items from my own lists.
- As a user, I can copy individual items or all items from one list to another.

### Collaborative Lists

- As a user, I can invite another user to collaborate on a list, making it shared.
- As a collaborator, I can add items to a shared list.
- As a collaborator, I can upvote items on a shared list (one vote per item per user).
- As a collaborator, I can see items ranked by vote count.
- As a collaborator, I can mark an item as done, which adds it to my personal diary as "finished".
- As a collaborator, I can copy items from a collaborative list to one of my personal lists.

### Friends & Discovery

- As a user, I can search for other users by username.
- As a user, I can send a friend request by email or via a profile page.
- As a user, I can accept or decline friend requests.
- As a user, I can view friends' lists that are marked friends-only or public.
- As any visitor, I can browse public lists (logged out or logged in).
- As any visitor, I can search for a media item and see the community average rating from users who've finished it.

---

## 4. Data Model

### User
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| username | string, unique | |
| email | string, unique | |
| password_hash | string | |
| display_name | string, nullable | |
| created_at | timestamp | |

**Relationships:**
- `friends`: self-referential many-to-many (symmetric, via a `Friendship` join table with a `status` field: pending/accepted)

---

### Media
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| title | string | |
| year | integer, nullable | |
| creator | string, nullable | Director for movies, author for books, etc. |
| type | enum | `movie`, `tv_show`, `book` — open to extension |
| external_id | string, nullable | Reserved for TMDB, Open Library, etc. |
| created_by | FK → User | Who added this to the catalog |
| created_at | timestamp | |

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
| season | FK → Season, nullable | For season-level TV entries |
| status | enum | `wishlist`, `in-progress`, `paused`, `abandoned`, `finished` |
| rating | integer, nullable | 1–10 (represents 0.5–5.0 stars in half-star steps) |
| notes | text, nullable | Always private |
| date_finished | date, nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Constraints:**
- `(user, media, season)` should be unique — one diary entry per user per media item (or per season for TV)
- `rating` only meaningful when `status = finished` (enforce at app layer or via check)

**Watched/Read With:**
- `watched_with`: many-to-many to User via `DiaryEntryCompanion` join table

---

### List
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| owner | FK → User | |
| name | string | |
| visibility | enum | `private`, `friends`, `public` |
| created_at | timestamp | |

**Relationships:**
- `members`: many-to-many to User via `ListMember` join table (presence = collaborator; owner is implicitly a member)

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
- `(list, media)` unique — a media item appears once per list

---

### ListVote
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| list_item | FK → ListItem | |
| user | FK → User | |

**Constraints:**
- `(list_item, user)` unique — one vote per user per item

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
- `(requester, addressee)` unique

---

## 5. Feature Spec

### 5.1 Authentication

Standard email/password auth. Passwords hashed (bcrypt or argon2). Session-based or JWT — implementation choice. No OAuth in v1.

Password reset via email is a day-2 concern but include the email field from the start.

---

### 5.2 Media Catalog

**Search:** Full-text or ILIKE search on `title`. Filter by `type`. Return title, year, creator, type.

**Add item:** Any logged-in user can add a media item. Fields: title (required), type (required), year, creator. `external_id` is stored but not exposed in the UI in v1.

**TV Seasons:** When adding or editing a `tv_show`, the user can add seasons (number + optional title). Seasons can be added incrementally as they're logged.

**Deduplication:** No automated dedup in v1. Rely on search-before-add UX. Flag as a known rough edge.

---

### 5.3 Diary

**Status lifecycle:**

```
wishlist → in-progress → finished
                       ↘ paused → in-progress (resume)
                       ↘ abandoned
```

No hard enforcement of transitions — users can set any status directly. The state machine is a UX guide, not a constraint.

**Rating:** Displayed as half-stars (0.5–5.0). Stored as integer 1–10. Null if not yet rated. Only surfaced meaningfully for `finished` entries, but not blocked for other statuses.

**TV show entries:** A user can have:
- One diary entry for the show itself (overall status/rating)
- Separate diary entries per season (linked via `season` FK)

Season entries inherit the show's diary entry implicitly (i.e., if you log season 2, the show entry should exist or be created automatically).

**Notes:** Free text, always private, never visible to other users, never aggregated.

**Companions:** Optional. "Watched with" links to other registered users. These are just associations — no notifications sent.

**Date finished:** Optional date field. No time, just date.

**Diary views:**
- All entries (paginated)
- Filter by: status, media type, year finished, rating range
- Sort by: date added, date finished, rating, title

---

### 5.4 Lists

**Personal lists:** Each user starts with a default "Wishlist" list (created on signup). They can create additional named lists.

**Visibility:**
- `private`: only the owner (and collaborators) can see it
- `friends`: visible to accepted friends
- `public`: visible to anyone, including logged-out users

**List items:** Each item is a `Media` reference. Adding an item that's already in the list is a no-op (or a soft error).

**Copy operations:**
- Copy one item from list A to list B
- Copy all items from list A to list B
- Works in any direction: personal → personal, collaborative → personal, personal → collaborative (if user is a member)
- Duplicates are silently skipped

**List display:** Show title, type, year, creator. For collaborative lists, show vote count and who added the item.

---

### 5.5 Collaborative Lists

**Making a list collaborative:** The owner invites another user by username. Accepted invite = they become a `ListMember`.

**Member permissions:**
- Any member can add items
- Any member can vote (once per item)
- Any member can mark an item done (adds to their own diary)
- Only the owner can remove members or delete the list
- Any member can remove items they added; owner can remove any item

**Voting:** Each user gets one upvote per `ListItem`. Toggling (un-vote) is allowed. Items are sorted by vote count descending by default, with tie-breaking by `added_at`.

**Mark as done:** Marks the item in the collaborative list context (not removed from list — other members may not have finished it). Triggers creation of a `DiaryEntry` with `status=finished` for that user. If a diary entry already exists for that user+media, update its status to `finished`.

**Leaving a list:** A member (non-owner) can leave a collaborative list. Their votes and "added_by" records remain (soft attribution).

---

### 5.6 Friends

**Finding users:**
- Search by exact or partial username
- Invite by email (sends an email if the address matches a registered user; no-op or pending invite if not)

**Friend request flow:**
1. User A sends request to User B
2. User B sees pending request and accepts or declines
3. On accept, both can see each other's `friends`-visibility lists

**Friend visibility:** Friendship is symmetric. If A and B are friends, A sees B's friends-only lists and vice versa.

**Removing a friend:** Either user can remove the friendship. Access to friends-only lists is revoked immediately.

---

### 5.7 Discovery

**Browse public lists:** Paginated feed of public lists, sorted by most recently updated. Show list name, owner username, item count.

**Community ratings:** On a media item's page, show:
- Average rating (from `DiaryEntry` where `status=finished` and `rating IS NOT NULL`)
- Number of ratings

No individual ratings shown — only the aggregate. This is intentional.

**Search results enrichment:** Search results for media items show community average rating inline.

---

## 6. Phasing

### v1 — Core Product

Everything described above is v1 unless listed below.

**v1 includes:**
- Auth (signup, login, logout)
- Media catalog (search, add, TV seasons)
- Diary (all statuses, ratings, notes, companions, date finished)
- Personal lists (create, manage, visibility, copy)
- Collaborative lists (invite, add items, vote, mark done)
- Friends (search, invite by username, request/accept flow)
- Discovery (browse public lists, community ratings)

### Phase 2 — Notifications

- Notify a user when someone marks a collaborative list item as done
- Notify when a friend request is received
- Notify when added as a companion on a diary entry
- Delivery: in-app notification bell + optional email digest

### Phase 3 — External Catalog Enrichment

- Integrate TMDB for movies/TV: auto-populate title, year, director, poster art on add
- Integrate Open Library or Google Books for books
- Use `external_id` to link and sync metadata
- De-duplicate catalog entries that refer to the same external entity

### Phase 4 — Import / Export

- Import from Letterboxd (movies/TV)
- Import from Goodreads (books)
- Export diary as CSV or JSON

### Phase 5 — Extended Media Types

- Podcasts (episodes or series)
- Music albums
- Video games
- The `type` enum and schema are designed to accommodate this without structural changes

---

## 7. Open Questions

1. **Logged-out access to public lists:** The design says "TBD" on whether logged-out users can see public lists. Leaning yes, but needs a decision before building the visibility layer. Recommendation: allow it — it's good for shareability and has low risk given no PII is exposed.

2. **Default wishlist behavior:** Should adding a media item directly from search auto-add it to the user's default wishlist? Or is it always a two-step action (find → choose list)? UX decision with no wrong answer.

3. **"Mark as done" on a collaborative list — prompt for rating?** When a user marks an item done on a collaborative list, should they be immediately prompted to rate it? Probably yes — good UX moment. Needs design.

4. **Catalog ownership and editing:** Can any user edit a media item another user added (e.g., fix a typo in the title)? Or only the original adder? Community wikis get messy; strict ownership is limiting. Consider: any user can suggest an edit, only the original adder (or an admin) can approve. Keep it simple for v1 — any logged-in user can edit.

5. **Duplicate catalog entries:** Without external API enrichment, duplicates will happen (e.g., "The Godfather" vs "Godfather, The"). How to handle merging? Defer to phase 3, but acknowledge as a known issue in v1.

6. **Collaborative list item removal:** If user A added an item and user B voted on it, and then A removes the item — B's vote is cascade-deleted. Is this the right behavior? Almost certainly yes, but worth calling out.

7. **Rating visibility:** Currently only community averages are public. Should friends be able to see each other's ratings (not notes, just stars)? Could be a nice social touch without crossing into "reviews." Leave as a phase 2 decision.

8. **Password reset:** Needed before any real users beyond the initial two. Scope it as a v1 must-have before any wider launch, even if it's out of the initial build sprint.
