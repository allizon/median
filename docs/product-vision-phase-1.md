# Median — Product Vision: Phase 1

## Origin & Core Identity

Median started as a way for two people to keep track of things they wanted to watch, individually and together. Everything else — media logging, social features, discovery — is born from that seed.

**Core job to be done:** Decision support + shared memory for small groups.

The primary loop is:
1. Someone encounters something interesting → adds it to a list
2. The group expresses enthusiasm → sorting surfaces what to watch next
3. They watch it → mark it done → log it
4. The diary is the output: a record of what you've seen together and apart

## Scope

**Phase 1: Movies and TV only.** Books are deferred. Books are a solo activity, the logging model is different (by book? by series? by reading session?), and the collaborative angle doesn't apply the same way. Revisit when the core loop is proven.

## Lists

### Personal Lists

Each user has their own watchlist. Personal lists exist for:
- Things you want to watch alone
- Things you're considering proposing to a shared list
- Individual prioritization via enthusiasm scores

Personal lists are self-sorting by enthusiasm score — high enthusiasm floats up, forgotten additions sink. This keeps the list actionable rather than a graveyard.

### Shared/Collaborative Lists

Small groups (starting with two people) share a list for things they want to watch together.

**Key principles:**
- **Open add:** Anyone on the list can add anything directly. No approval required.
- **Open remove:** Anyone on the list can remove anything. No approval required.
- **No gates:** The list is a collaborative space, not a negotiation system. Consensus happens through engagement, not process.

### The Enthusiasm Score

Rather than a simple upvote, each list item gets an enthusiasm score per user. The score expresses how much that person wants to watch the item.

| Score | Meaning |
|-------|---------|
| 4 | Strong yes |
| 3 | Sure, I'm in |
| 2 | Fine by me |
| 1 | Not really, but ok |
| 0 | No — removes item from shared list |

**On personal lists:** Users score their own items to help prioritize their individual queue.

**On shared lists:** Each member scores items independently. The list sorts by a weighted average score (exact formula TBD — should account for participation rate so an item two people scored 3 outranks one person's 4 with no response from anyone else).

**A score of 0 on a shared list is a hard removal.** This must be clearly communicated in the UI — a "No" vote is not just low enthusiasm, it removes the item from the list for everyone. This is intentional: if the point is to enjoy something together, a single "I don't want to watch this" should be respected.

Labels for the scores are TBD — the app should feel playful and irreverent, and the exact words will read differently depending on the UI context. Candidates:

- Must watch / Yeah, sure / If we must / Meh / Hard pass
- Obsessed / I'm in / Fine / Whatever / Absolutely not
- omg yes / sure / i guess / nah / nope

Decide when designing the specific component.

### Suggesting Personal Items to a Shared List

A natural gesture: you look at your personal list, see something you scored highly, and want to propose it to a shared list. One action to move or copy it over. No approval needed on the receiving end — it just appears on the shared list, and members engage with it via their enthusiasm scores.

### Marking Something Watched

When something gets watched, anyone on the list can mark it done. This closes the loop and initiates the logging flow for that person. The app should nudge other list members — "Jeff marked Severance as watched — did you watch it too?" — to capture companion entries without requiring coordinated action.

Context determines scope:
- Marked done from a **personal list** → creates a diary entry for that user only
- Marked done from a **shared list** → creates a diary entry for the person who marked it, nudges others to log theirs

## The Diary

The diary is the output of the core loop, not the driver. It's a record of what you've watched, when, with whom, and what you thought.

Diary details (fields, TV season logging UX, companion tagging, etc.) are still being designed. The key principle: logging should feel like a natural close to the watching experience, not a chore.

## In-App Notifications

Collaborative features don't work without some form of notification. In-app notifications are needed from day one — they are part of the UI, not an external communication channel.

Minimum needed for the collaborative loop:
- Something was added to a shared list you're on
- Someone scored an item on a shared list
- Something was marked watched

Email/push notifications are deferred to a later phase.

## Social Graph & Public Features

Deferred. The initial proving ground is a known, small group. A general social graph (friend requests, user search, public profiles, discovery feed) can be added later if the core experience proves out. It may never be needed.

## Open Questions

- Exact sorting algorithm for shared lists (weighted average details)
- Enthusiasm score labels (decide at UI design time)
- TV show logging UX: show-level vs. season-level vs. episode-level entries
- What the in-app notification surface looks like (feed? badge? inline?)
- App name: "Median" works but doesn't have much personality — revisit once the product feels more defined
