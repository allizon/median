# Add to List: TMDB Fallback Design

**Date:** 2026-06-13
**Status:** Approved

---

## Goal

Closes #57. `AddToListSearchModal` (used on list pages, e.g. the Watchlist) only searches the existing catalog via `searchCatalog`. If a title isn't in the catalog yet, the user has to leave the list, go to `/search`, add the title via TMDB, then come back and search again to add it to the list.

This change makes that a single step: when the catalog search returns no results, fall back to a TMDB search in the same modal, and let the user create the `Media` row and add it to the list in one action.

---

## Scope

**In scope:**
- TMDB fallback search in `AddToListSearchModal` when `searchCatalog` returns zero results for a non-empty query
- Rendering TMDB results (poster, title, year, type) matching `add-media-modal.tsx`'s style
- Selecting a TMDB result: create the `Media` row (via `createMedia`, with `externalId`/`posterPath`) and add it to the current list (via `addToList`) in one action
- Duplicate-candidate handling matching `add-media-modal.tsx`'s `handleSelectTmdb` ("Use this" / "Create new anyway"), adapted so "Use this" adds the existing candidate to the list

**Out of scope:**
- Changing `/search` or `add-media-modal.tsx` (the existing TMDB search-first flow there is unchanged)
- Changing `searchCatalog` or `createMedia` server actions — both already support what's needed

---

## Flow

1. User types a query. `searchCatalog(query)` runs on the existing 300ms debounce, as today.
2. If `searchCatalog` returns **zero results** for a non-empty query, fire `searchTmdb(query)` and render its results in place of the current "try /search" message. If `searchCatalog` returns results, behavior is unchanged — no TMDB call.
3. Selecting a TMDB result calls `createMedia({ title, type, year, externalId, posterPath }, force)`:
   - `"error"` → error toast (same style as existing `handleAdd` error path)
   - `"duplicates"` → show candidates list:
     - **"Use this"** on a candidate → `addToList(listId, candidate.id)` (same as existing catalog "+ Add")
     - **"Create new anyway"** → re-call `createMedia(..., force=true)`, which returns `"created"`
   - `"created"` → `addToList(listId, mediaId)`, then mark added, toast `Added "<title>" to <listName>`, call `onAdded()`

## State additions to `AddToListSearchModal`

Mirroring the equivalent state already in `add-media-modal.tsx`:

- `tmdbResults: TmdbResult[]`
- `tmdbSearching: boolean`
- `tmdbError: string | null`
- `tmdbDuplicates: DuplicateCandidate[]`
- `pendingTmdbResult: TmdbResult | null` (the result being retried as "create new anyway")
- `savingTmdbId: string | null` (externalId of the result currently being added, for button loading state)
- `searchGenRef` (existing pattern from `add-media-modal.tsx`) to guard against the catalog→TMDB sequential lookups racing with a newer query

## Sequencing

Catalog search first; TMDB search only runs if catalog returns zero results. One extra round-trip only in the fallback case, rather than always firing both searches.

## Error handling

- TMDB search failure (`searchTmdb` returns `"error"`): show `tmdbError` message in place of results, same as `add-media-modal.tsx`'s `searchError`.
- `createMedia`/`addToList` failures: toast, matching the existing `handleAdd` error path. No new error UI patterns introduced.

## Testing

- Component test (or extend existing coverage) for `AddToListSearchModal`:
  - catalog has results → no TMDB call, existing UI unchanged
  - catalog empty → TMDB results render with posters/year/type
  - selecting a TMDB result with no duplicates → `createMedia` + `addToList` called, item marked added
  - selecting a TMDB result with duplicates → candidates shown; "Use this" calls `addToList` directly; "Create new anyway" force-creates then adds
