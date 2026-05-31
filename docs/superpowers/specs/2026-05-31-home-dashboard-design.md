# Home Dashboard Design

**Date:** 2026-05-31  
**Status:** Approved

---

## Goal

Replace the placeholder home page (`/`) with a real, useful dashboard for logged-in users. Add a persistent nav bar across all pages. Unauthenticated users hitting `/` are redirected to `/login`.

---

## Scope

**In scope:**
- Route group restructure (`(app)` and `(public)`)
- Persistent top nav bar (Median, Search, @username)
- Home dashboard with three widgets: dual CTA, My Lists, Up Next
- Auth redirect for the `(app)` group
- Nav bar on all existing pages

**Out of scope:**
- Log It sheet (the "Log something" CTA links to `/search` for now)
- Lists page (`/lists/[id]`) — My Lists cards link there but the page is a future task
- "New list" button on the dashboard
- Diary widget, Collaborative Activity widget (deferred until those features exist)

---

## Route Structure

Introduce two route groups. Neither changes any URLs.

```
src/app/
  (app)/                        ← protected pages (auth redirect in layout)
    layout.tsx                  ← auth check + nav bar
    page.tsx                    ← home dashboard
  (public)/                     ← public pages (nav bar, no auth redirect)
    layout.tsx                  ← nav bar only (session optional)
    search/
      page.tsx
    media/
      [id]/
        page.tsx
    profile/
      [username]/
        ...
  layout.tsx                    ← root layout (fonts, providers) — unchanged
  login/                        ← outside both groups (no nav, no auth check)
  signup/
  settings/                     ← moves into (app)/ (already auth-protected)
  api/
```

**`(app)/layout.tsx`:** Calls `auth()`. If no session, redirects to `/login`. Renders the nav bar and `{children}`.

**`(public)/layout.tsx`:** Renders the nav bar with an optional session (no redirect). The nav bar component handles both authenticated and unauthenticated states.

---

## Nav Bar

Server component. Defined once in a shared component (`src/components/nav.tsx`), used by both layout files.

| Position | Element | Notes |
|---|---|---|
| Left | "Median" | Links to `/` |
| Right | "Search" | Links to `/search` |
| Right | "@username" | Links to `/profile/[username]`. When unauthenticated, shows "Sign in" linking to `/login` instead. |

No dropdown, no logout button. Minimal: three links. Works on all viewport sizes without a hamburger menu — the text is short enough to fit.

---

## Home Dashboard (`/`)

Server component. Data fetched in parallel.

### Layout

```
┌─────────────────────────────────────┐
│  nav: Median · Search · @username   │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ + Add to     │ │ ✎ Log        │  │
│  │   Wishlist   │ │   something  │  │
│  └──────────────┘ └──────────────┘  │
│                                     │
│  ┌──────────────┐ ┌──────────────┐  │
│  │  MY LISTS    │ │  UP NEXT     │  │
│  │  Wishlist 12 │ │  Dune · Film │  │
│  │  Weekend  4  │ │  The Bear·TV │  │
│  │  Book club 7 │ │  Tomorrow·Bk │  │
│  └──────────────┘ └──────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

On mobile: 2-column CTA buttons remain side by side (short labels). My Lists and Up Next stack to single column.

### CTA Area

Two equal-weight buttons, side by side, full-width of the content area:

- **"+ Add to Wishlist"** → links to `/search` (primary button style)
- **"✎ Log something"** → links to `/search` (outline button style)

Both currently route to `/search`. The visual distinction anticipates future intent: Add to Wishlist will remain a search-then-add flow; Log something will eventually open the Log It sheet from search results.

### My Lists Widget

**Data:** All lists where the user is owner or member. Ordered: default Wishlist first, then by `updatedAt` descending.

**Each card shows:**
- List name
- Item count
- Visibility badge (`private` / `friends` / `public`)
- Collaborator indicator if `members.length > 0` (e.g., "2 members")

**Links:** Each card links to `/lists/[id]` (page not yet built — will 404 gracefully until then).

**No "New list" button** in this widget — deferred until the lists page exists.

> **Schema note:** `List` currently has no `updatedAt` field. Add it (with `@updatedAt`) so My Lists can sort by most recently active.

### Up Next Widget

**Data:** Top 5 items from the user's default Wishlist, ordered by `addedAt` ascending (oldest-added first).

**Each row shows:** Media title and type label (Movie / TV Show / Book). Links to `/media/[id]`.

**Empty state:** "Nothing in your Wishlist yet. [Search to add something →]" with the link going to `/search`.

---

## Data Fetching

Single server component, queries run in parallel via `Promise.all`:

```ts
const [lists, wishlistItems] = await Promise.all([
  // All lists owned by or collaborated on
  prisma.list.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    orderBy: [{ isDefaultWishlist: 'desc' }, { updatedAt: 'desc' }],  // requires updatedAt on List
    select: {
      id, name, visibility, isDefaultWishlist,
      _count: { select: { items: true, members: true } },
    },
  }),

  // Top 5 wishlist items
  prisma.listItem.findMany({
    where: { list: { ownerId: userId, isDefaultWishlist: true } },
    orderBy: { addedAt: 'asc' },
    take: 5,
    select: { media: { select: { id, title, type } } },
  }),
]);
```

---

## Empty States

| Situation | Display |
|---|---|
| My Lists — only empty Wishlist | Wishlist card shown with "0 items" |
| Up Next — empty Wishlist | "Nothing in your Wishlist yet. [Search to add something →]" |
| My Lists — somehow empty | "No lists yet." (shouldn't happen — signup creates Wishlist) |
