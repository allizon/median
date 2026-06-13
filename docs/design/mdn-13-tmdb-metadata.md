# Design: Metadata fetch from public API sources (TMDB)

**Issue:** [#13](https://github.com/allizon/median/issues/13) · **Status:** Approved

## Context

Adding a movie or TV show to Median today is fully manual: `AddMediaModal` asks the
user to type title, type, year, creator, and seasons by hand, and `searchCatalog`
only searches the local Postgres catalog. There is no way to auto-populate metadata,
which is slow for users and produces messy, inconsistent catalog data (typos,
near-duplicate rows, missing years).

This design integrates **TMDB** as a metadata source so the add-media flow becomes
**search-first**: the user searches TMDB live, picks a real result, and the fields
auto-fill from authoritative data. The catalog gains stable external IDs, enabling
reliable de-duplication and a link back to the full TMDB page. Manual entry remains
as a fallback so TMDB is an enhancement, never a gate.

## Decisions

1. **API scope:** TMDB only. Covers movies + TV (the only exposed media types).
   Open Library / Google Books is a books-era follow-on, out of scope here.
2. **UX trigger:** **Search-first.** The modal opens with a TMDB search box; manual
   entry is the fallback escape hatch, not the default.
3. **Storage:** **Snapshot at import.** Copy title/year/posterPath into our own
   columns plus `externalId`; never re-fetch TMDB on render.
4. **TMDB page link:** Derived in the UI from `externalId` + `type`
   (`themoviedb.org/movie/{id}` or `/tv/{id}`). No new column.
5. **Poster:** Add a `posterPath String?` column now; snapshot the TMDB path.
6. **Creator:** **Skip from TMDB for v1** (manual-only). Avoids a second credits API
   call; revisited in the books plan.
7. **Seasons:** **Manual-only for v1** (no TMDB season fetch). Auto-fetch noted as a
   planned follow-up.
8. **Fallback:** Manual entry always reachable — on no-results, API error, or
   incomplete data.
9. **Architecture:** One server action calling a thin `src/lib/tmdb.ts` fetch wrapper;
   server-only `TMDB_API_KEY`; native `fetch` with light Next caching; debounced
   client calls.
10. **Dedupe:** Match on `externalId` first; fall back to title+type for
    manually-entered items.

## Field mapping (TMDB → Media)

| Median field | TMDB source | Notes |
|---|---|---|
| `title` | `title` (movie) / `name` (tv) | |
| `year` | `release_date` / `first_air_date` | parse leading 4 digits → Int |
| `type` | `media_type` (`movie`→`movie`, `tv`→`tv_show`) | |
| `externalId` | `id` (as string) | also used to build TMDB link + dedupe |
| `posterPath` | `poster_path` | new column; store path only (e.g. `/abc.jpg`) |
| `creator` | — | **not populated from TMDB**; manual-only |
| seasons | — | **not populated from TMDB**; manual-only |

## Implementation

### 1. Schema — `prisma/schema.prisma`
- Add `posterPath String?` to the `Media` model. Generate a migration.
- `externalId String?` already exists — reuse it.

### 2. TMDB wrapper — new `src/lib/tmdb.ts`
- `searchTmdb(query)`: calls TMDB `/search/multi` (filters to `movie` + `tv`
  results, drops `person`), maps each hit to a normalized shape
  `{ externalId, title, year, type, posterPath, posterUrl }`.
- Reads `process.env.TMDB_API_KEY` (server-only). Throws/returns an error sentinel
  on non-OK responses so the action can surface the fallback state.
- Native `fetch`; rely on Next's fetch caching (`next: { revalidate: ... }`) — no
  Redis, no new dependency.
- Build poster thumbnail URLs from TMDB's image base + `posterPath`.

### 3. Server action — `src/lib/actions/media.ts`
- New `searchTmdb(query)` action (`"use server"`, `auth()` check first), returning a
  tagged union consistent with existing convention:
  `{ status: "ok"; results: TmdbResult[] } | { status: "empty" } | { status: "error" }`.
- Extend `checkMediaDuplicates` to accept an optional `externalId` and do an
  exact-match branch first (reuse existing row), falling back to the current
  title+type case-insensitive match for manual entries.
- `createMedia` / `createMediaSchema`: accept optional `externalId` and `posterPath`
  and persist them. Keep `force` override behavior.

### 4. UX — `src/components/add-media-modal.tsx`
- Restructure to **search-first**:
  - Default view: search box → debounced (~300ms, reuse the pattern from
    `add-to-list-search-modal.tsx`) `searchTmdb` call → result list showing poster
    thumbnail, title, year, type badge.
  - Selecting a result auto-fills the (still-editable) form fields, sets
    `externalId` + `posterPath`, then runs the `externalId`-aware duplicate check.
  - **Fallback states:** `empty` → "No matches found — Add it manually" button that
    reveals the manual form pre-filled with the typed query; `error` → non-blocking
    "Couldn't reach TMDB — add manually" message with the same escape hatch.
  - Manual form = today's fields (title/type/year/creator/seasons), always reachable.
- `add-to-list-search-modal.tsx`: in the add-to-list flow, when a chosen TMDB item
  already exists by `externalId`, reuse the existing catalog row rather than creating
  a duplicate.

### 5. Config
- Add `TMDB_API_KEY=` to `.env.example` (server-only; never `NEXT_PUBLIC_`).

## Future enhancements (explicitly deferred)
- **TMDB season auto-fetch** for TV shows (via the TV details endpoint).
- **Creator/director auto-fetch** via `/movie/{id}/credits` — revisited in the books
  plan alongside Open Library / Google Books.
- **Poster rendering** on media pages and lists (data captured now; display is
  follow-on, MDN-37).
- Multi-source provider abstraction once books ship.

## Verification
- **Unit:** `tests/` — test `src/lib/tmdb.ts` mapping (TMDB sample payload →
  normalized shape, year parsing, movie/tv discrimination) and the `externalId`
  dedupe branch in `checkMediaDuplicates`. Run with `pnpm test`.
- **Manual, app-driven (requires a real `TMDB_API_KEY`):**
  1. Open the add-media modal, search "The Bear" → see live results with posters.
  2. Pick one → fields auto-fill; save → confirm `externalId` + `posterPath` + year
     persisted in the DB.
  3. Add the same title again → duplicate detection surfaces the existing row.
  4. Search gibberish → "No matches" → manual-entry fallback works, pre-filled.
  5. Temporarily set a bad `TMDB_API_KEY` → error state shows, manual entry still
     works.
