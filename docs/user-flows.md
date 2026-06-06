# Median — User Flows

## The mental model

The app has three zones a user moves between:

1. **The dashboard** — home base; surfaces what needs attention and what to do next
2. **Lists** — where decisions happen (what do we want to watch?)
3. **The diary** — where history lives (what have we watched?)

The catalog (media search + item pages) is infrastructure that connects these zones — you find something, add it to a list, and it enters the decision loop.

---

## Flow 1: First-time user

```
Sign up
  → Home dashboard (empty state)
    → Prompted to search for something to add to Wishlist
      → Catalog search → select item → added to Wishlist
    → Prompted to invite someone to a list (or skip)
```

The empty dashboard is a high-risk moment. New users need to immediately understand the value — the empty state should guide them into the core loop rather than present a blank screen.

---

## Flow 2: Returning user (daily/weekly use)

```
Log in (or already authenticated)
  → Home dashboard
    → Check notifications (badge on nav)
    → See "Up Next" widget — items at top of shared list
    → See recent diary entries
    → Act on something (score an item, mark something watched, add something new)
```

The dashboard is the answer to "what do I do now?" It should always have something actionable.

---

## Flow 3: Adding something to a list

**Entry point A: I know what I want to add**
```
Dashboard or nav → Catalog search
  → Find item → Item page
    → "Add to list" → list picker (Wishlist, personal lists, shared lists)
      → Item added → optional: set enthusiasm score inline
```

**Entry point B: I'm browsing a list and want to add something**
```
List page → "Add something" CTA
  → Catalog search (in context of this list)
    → Select item → added directly to this list
```

**Entry point C: Item doesn't exist in catalog**
```
Catalog search → no results
  → "Add it yourself" CTA → create media item form
    → Item created → immediately offered to add to a list
      → Continue into list picker flow
```

---

## Flow 4: Working with a personal list

```
Dashboard Widget ("My Lists") → select a list
  → List page
    → Browse items (sorted by enthusiasm score, high → low)
    → Set/update enthusiasm score on any item (0–4 picker)
    → Remove an item (optimistic, undo toast)
    → "Log it" on an item → Log it sheet (Flow 7)
    → "Suggest to shared list" on a high-scored item → list picker → item added to shared list
    → "Add something" → catalog search in context (Flow 3B)
```

---

## Flow 5: Creating a shared list and inviting someone

```
Dashboard → "New list" button
  → Create list sheet (name + visibility)
    → List created (personal, initially)
      → List page (empty)
        → "Invite someone" → username input
          → Invite sent → in-app notification to invitee
            → [invitee: Flow 6]
          → List is now collaborative
          → Owner continues: add items, score them
```

The first invite is a mode transition — the list graduates from personal to collaborative.

---

## Flow 6: Receiving and accepting a list invite

```
Invitee gets in-app notification: "X invited you to [list name]"
  → Tap notification → list preview page
    → Accept → become a member → land on the list
      OR
    → Decline → notification dismissed, list not added
```

---

## Flow 7: Working with a shared list

```
Dashboard → list card (or notification) → shared list page
  → Browse items (sorted by weighted average enthusiasm score)
  → Set enthusiasm score on any item
      → Score 1–4: score recorded, list re-sorts
      → Score 0 ("No"): confirmation that this removes the item for everyone
        → Confirmed → item removed
  → Add an item → catalog search → item added
  → Remove an item → item removed (no confirmation needed, it's immediate)
  → "Mark as watched" on an item
      → Log it sheet opens pre-filled as "finished" (Flow 7a)
      → After logging: in-app notification to other members ("X watched [title] — did you too?")
        → Other members: tap notification → Log it sheet for themselves
```

### Flow 7a: Log it sheet

```
Log it sheet opens (from list item, media page, or dashboard)
  → Pre-filled context shown (title, type)
  → Set status: in-progress / paused / abandoned / finished
  → If finished (or always visible):
      → Optional: rating (half-stars, 1–5)
      → Optional: date finished
      → Optional: notes (private)
  → Save → diary entry created/updated → sheet closes → toast confirmation
```

---

## Flow 8: The diary

```
Dashboard Widget ("My Diary") → recent entries → "See all" → /diary
  → Full diary page
    → All entries, paginated
    → Filter by: status / media type / year / rating range
    → Sort by: date added / date finished / rating / title
    → Tap entry → entry detail (or inline expand)
      → Edit entry → Log it sheet pre-filled
```

---

## Flow 9: Notifications

```
Any page → notification badge (nav)
  → Notification feed / panel
    → "X added [title] to [list]" → tap → go to list, item highlighted
    → "X scored [title] on [list]" → tap → go to list
    → "X marked [title] as watched" → tap → Log it sheet for yourself
    → "X invited you to [list]" → tap → list preview + accept/decline (Flow 6)
    → Mark all read / mark individual read
```

---

## Flow 10: TV show logging

*UX specifics TBD in MDN-10, but the intended model:*

```
Find a TV show → Item page
  → Show-level: "Currently watching" / "Add to list" (same as any media)
  → Season-level: expand seasons → "Log season X"
    → Log it sheet scoped to that season
      → Status, rating, notes apply to the season
  → Show-level diary entry reflects aggregate progress
```

---

## Key interaction points (where the flows connect)

| From | Gesture | To |
|------|---------|-----|
| Dashboard | "New list" | Create list sheet |
| Dashboard | Log Something widget | Catalog search → Log it sheet |
| Catalog search | Select result | Media item page |
| Media item page | "Add to list" | List picker sheet |
| List item | Enthusiasm score | Score picker (inline) |
| List item | "Mark as watched" | Log it sheet |
| List item | "Suggest to shared list" | List picker sheet |
| Log it sheet | Save | Diary entry created |
| Notification | Tap | Relevant list / Log it sheet |

---

## Open questions surfaced by mapping these flows

- **Dashboard empty state:** what does a brand new user see, and what's the first action they're nudged toward?
- **"Suggest to shared list" gesture:** is this a button on the personal list item row, or an overflow action? How does it feel distinct from "Add to list" on a media page?
- **List picker sheet:** this appears in multiple flows (add to list, suggest to shared list). It needs to clearly distinguish personal lists from collaborative lists now that they're different things.
- **Notification delivery:** are notifications real-time (SSE/websocket) or only visible on page load/navigation? This affects how urgent the "X marked [title] as watched" nudge feels.
- **TV show entry point:** is the season-level logging surface on the show's media item page, or does it only appear after you've logged the show as "in-progress"?
