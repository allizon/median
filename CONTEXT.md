# Median

Median is a personal media diary and wishlist context where users track consumption and collaborate on curated media lists.

## Language

**Anonymous Visitor**:
A person who is not logged in and has no authenticated account session.
_Avoid_: guest user, public user

**Public List**:
A list intentionally visible to any viewer, including an Anonymous Visitor.
_Avoid_: open list, shared list

**Friends-Only List**:
A list visible only to users with an accepted friendship relation to the list owner.
_Avoid_: semi-private list

**Private List**:
A list visible only to the owner and explicit collaborators.
_Avoid_: hidden list

## Relationships

- A **List** has exactly one visibility mode: **Private List**, **Friends-Only List**, or **Public List**
- An **Anonymous Visitor** can view a **Public List** only
- An authenticated friend can view a **Friends-Only List** when friendship is accepted

## Example dialogue

> **Dev:** "Can someone without an account open this URL?"
> **Domain expert:** "Yes, if it is a **Public List**; **Friends-Only List** and **Private List** always require authentication."

**DiaryEntry**:
A user's personal record of actively consuming a media item: status (`in-progress`, `paused`, `abandoned`, `finished`), rating, private notes, companions, and dates. A DiaryEntry is created when a user first engages with a media item — not when they wishlist it.
_Avoid_: log entry, watch record

**ListItem**:
A media item's position within a specific list. Carries no consumption state.
_Avoid_: diary item, watch entry

**List**:
A named, user-owned collection of media items with a visibility setting and optional collaborators.
_Avoid_: watchlist (too narrow), collection

**Wishlist**:
The default personal **List** every user has on signup, used to track media they want to consume. Expressed as a **List** with **ListItems** — never as a **DiaryEntry** status.
_Avoid_: watch later, want-to-read

**Log** (verb):
The explicit user action of creating a **DiaryEntry** for a media item — analogous to Letterboxd's "log a movie". A DiaryEntry never comes into existence implicitly; the user always initiates it. The entry point is `status=in-progress` (or directly `finished` via "mark as done").

## Public surface area

On a **Public List** page visible to an **Anonymous Visitor**, the following fields are exposed:

- List name
- Owner **username** (not email, not display name)
- Item count
- Each list item's media title, type, year, and creator
- Community average rating for each media item (aggregate only, no individual ratings)

The following are never exposed to unauthenticated viewers:

- Any user's diary notes
- Individual user ratings
- Companion/watched-with data
- Email addresses

## Add-to-list flow

From search results, the primary action is **"Add to Wishlist"** (one-step, targets the user's default Wishlist). A secondary **"Add to list…"** action opens a list picker for any other destination. This is the canonical add flow for v1.

## Flagged ambiguities

- PRD conflict resolved: logged-out browsing of public lists was marked both supported and TBD; resolution is that **Anonymous Visitors can browse Public Lists in v1**.
- PRD had `wishlist` as a `DiaryEntry.status` value. Resolved: `wishlist` is removed from the status enum. Wanting to consume something is expressed as a **ListItem** in the user's **Wishlist** list, not as a diary status. A **DiaryEntry** only exists once active consumption begins.
- PRD said season logs auto-create a show-level DiaryEntry. Resolved: the show-level DiaryEntry must be logged explicitly first. Season entries are optional sub-logs attached to it. No auto-creation of any DiaryEntry.
- Rewatches/re-reads: not supported in v1. The `(user, media, season)` unique constraint holds. Re-engaging with a media item updates the existing DiaryEntry. Rewatch history is a phase 2 concern.
- Collaborative list item removal: owner can remove any item (cascade-deletes all votes on it); members can only remove items they added. Acknowledged as a rough edge — a member's votes disappear silently if the owner removes the item they voted on.
- Community average rating: only show-level DiaryEntries (`season=NULL`, `status=finished`, `rating IS NOT NULL`) contribute to the aggregate. Season-level ratings are excluded to prevent one user contributing multiple data points for the same media item.
- Catalog editing: any logged-in user can edit media metadata (title, year, creator) in v1. Log `updated_by` on the Media record for attribution. Suggest/approve flow deferred until user base grows beyond the initial cohort.
- Email functionality deferred entirely. The `email` field on User is stored but never used in v1 (no sending of any kind — no invites, no password reset, no digests). Email-dependent features (password reset, friend-invite-by-email, notification digests) are a future phase. Cost and infrastructure complexity not warranted for early versions.
- Friend discovery: username search only in v1. Each user has a shareable profile URL (`/users/:username`) with a "Send friend request" button and a copy-link affordance. No email-based invite flow.
- Rating visibility: friends can see each other's star ratings (1–10 integer / 0.5–5.0 display) on diary entries. Notes are always private to the owner. Unauthenticated visitors and non-friends never see individual ratings — only community averages.
- Password reset: no self-service mechanism in v1. Manual database reset only. Must be implemented (requires email infrastructure) before any wider launch beyond the initial cohort.
- "Mark as done" on a collaborative list opens the same "Log it" sheet as the general Log action, pre-filled with `status=finished`. Optional rating and date finished inline. No special-case data path.
- Companion tagging: no consent required in v1 (closed user base). Flagged as a privacy gap — when Phase 2 adds companion notifications, opt-in/opt-out must be added at the same time.
- Auth mechanism: server-side sessions (database-backed or Redis), not JWT. JWTs cannot be truly invalidated without reintroducing server state, which is a security hole for a personal diary app. The PRD's "session or JWT" was left open by a previous agent; JWT was never a stated requirement.
