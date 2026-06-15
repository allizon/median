# Media Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the duplicated "search the catalog, fall back to TMDB, resolve duplicates, or enter manually" flow out of `AddToListSearchModal` and `AddMediaModal` into a single shared `MediaPicker` component, and close the `posterPath` validation gap in `createMedia`.

**Architecture:** A new client component `src/components/media-picker.tsx` owns all search/selection/duplicate-resolution/manual-entry state behind a 3-prop interface (`initialQuery?`, `disabledIds?`, `onSelect`). `AddToListSearchModal` and `AddMediaModal` become thin wrappers that render `MediaPicker` inside their existing `Modal`/`ModalContent` and differ only in what `onSelect` does with the resulting `{ id, title }` (add to list vs. close-and-navigate). `createMedia`'s Zod schema gains the same TMDB poster-path regex check that `backfillPosterPath` already enforces.

**Tech Stack:** Next.js App Router, React client components, Zod, Prisma, Vitest + Testing Library (jsdom).

---

## File structure

- **Create** `src/components/media-picker.tsx` — the deepened module. Built in two tasks: Task 1 adds search + selection + duplicate resolution (the "search step"); Task 2 adds the manual-entry step.
- **Create** `tests/components/media-picker.test.tsx` — tests for the new component.
- **Modify** `src/components/add-to-list-search-modal.tsx` — rewrite as a thin wrapper (Task 3).
- **Modify** `tests/components/add-to-list-search-modal.test.tsx` — rewrite as a thin integration test against a mocked `MediaPicker` (Task 3).
- **Modify** `src/components/add-media-modal.tsx` — rewrite as a thin wrapper (Task 4).
- **Create** `tests/components/add-media-modal.test.tsx` — new test file (Task 4).
- **Modify** `src/lib/actions/media.ts` — move `TMDB_POSTER_PATH_RE` above the schemas and apply it to `createMediaSchema.posterPath` (Task 5).
- **Modify** `tests/media-actions.test.ts` — add `createMedia` posterPath validation tests (Task 5).
- **Modify** `CONTEXT.md` — add the "Media Picker" domain term (Task 6).

---

### Task 1: MediaPicker — search, selection, and duplicate resolution

**Files:**
- Create: `src/components/media-picker.tsx`
- Test: `tests/components/media-picker.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// tests/components/media-picker.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MediaPicker } from "@/components/media-picker";

vi.mock("@/lib/actions/media", () => ({
  searchCatalog: vi.fn(),
  searchTmdb: vi.fn(),
  createMedia: vi.fn(),
}));

import { searchCatalog, searchTmdb, createMedia } from "@/lib/actions/media";

const mockSearchCatalog = vi.mocked(searchCatalog);
const mockSearchTmdb = vi.mocked(searchTmdb);
const mockCreateMedia = vi.mocked(createMedia);

const TMDB_MOVIE = {
  externalId: "550",
  title: "Fight Club",
  year: 1999,
  type: "movie" as const,
  posterPath: "/poster.jpg",
  posterUrl: "https://image.tmdb.org/t/p/w185/poster.jpg",
};

const CATALOG_ITEM = {
  id: "media-1",
  title: "Fight Club",
  type: "movie" as const,
  year: 1999,
  creator: "David Fincher",
};

async function typeQuery(query: string) {
  fireEvent.change(screen.getByPlaceholderText(/search by title/i), { target: { value: query } });
}

describe("MediaPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows catalog results and does not call TMDB when the catalog has matches", async () => {
    mockSearchCatalog.mockResolvedValue([CATALOG_ITEM]);

    render(<MediaPicker onSelect={vi.fn()} />);
    await typeQuery("fight club");

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
    });
    expect(screen.getByText("+ Add")).toBeInTheDocument();
    expect(mockSearchTmdb).not.toHaveBeenCalled();
  });

  it("falls back to TMDB when the catalog search returns nothing", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });

    render(<MediaPicker onSelect={vi.fn()} />);
    await typeQuery("fight club");

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
    });
    expect(screen.getByText(/Movie/)).toBeInTheDocument();
    expect(screen.getByText(/1999/)).toBeInTheDocument();
  });

  it("shows an error message when the TMDB search fails", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "error", message: "Search failed. Please try again." });

    render(<MediaPicker onSelect={vi.fn()} />);
    await typeQuery("fight club");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Search failed. Please try again.");
    });
  });

  it("marks catalog items in disabledIds as already added and ignores clicks on them", async () => {
    mockSearchCatalog.mockResolvedValue([CATALOG_ITEM]);
    const onSelect = vi.fn();

    render(<MediaPicker disabledIds={new Set(["media-1"])} onSelect={onSelect} />);
    await typeQuery("fight club");

    await waitFor(() => {
      expect(screen.getByText("Added ✓")).toBeInTheDocument();
    });
    expect(screen.queryByText("+ Add")).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("calls onSelect directly when a catalog item is chosen, and marks it Added", async () => {
    mockSearchCatalog.mockResolvedValue([CATALOG_ITEM]);
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("fight club");
    await waitFor(() => expect(screen.getByText("+ Add")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ Add"));

    expect(onSelect).toHaveBeenCalledWith({ id: "media-1", title: "Fight Club" });
    expect(mockCreateMedia).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("Added ✓")).toBeInTheDocument());
  });

  it("creates the media item and calls onSelect when a TMDB result is chosen", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });
    mockCreateMedia.mockResolvedValue({ status: "created", mediaId: "media-99" });
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("fight club");
    await waitFor(() => expect(screen.getByText("+ Add")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ Add"));

    await waitFor(() => {
      expect(mockCreateMedia).toHaveBeenCalledWith(
        {
          title: "Fight Club",
          type: "movie",
          year: 1999,
          externalId: "550",
          posterPath: "/poster.jpg",
        },
        false,
      );
    });
    expect(onSelect).toHaveBeenCalledWith({ id: "media-99", title: "Fight Club" });
    await waitFor(() => expect(screen.getByText("Added ✓")).toBeInTheDocument());
  });

  it("shows duplicate candidates and calls onSelect with the existing item via 'Use this'", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });
    mockCreateMedia.mockResolvedValue({
      status: "duplicates",
      candidates: [
        { id: "media-existing", title: "Fight Club", year: 1999, creator: "David Fincher", type: "movie" },
      ],
    });
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("fight club");
    await waitFor(() => expect(screen.getByText("+ Add")).toBeInTheDocument());
    fireEvent.click(screen.getByText("+ Add"));

    await waitFor(() => {
      expect(screen.getByText(/Similar items already exist/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Use this"));

    expect(onSelect).toHaveBeenCalledWith({ id: "media-existing", title: "Fight Club" });
    expect(mockCreateMedia).toHaveBeenCalledTimes(1);
  });

  it("force-creates and calls onSelect when 'Create new anyway' is chosen", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });
    mockCreateMedia
      .mockResolvedValueOnce({
        status: "duplicates",
        candidates: [
          { id: "media-existing", title: "Fight Club", year: 1999, creator: "David Fincher", type: "movie" },
        ],
      })
      .mockResolvedValueOnce({ status: "created", mediaId: "media-99" });
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("fight club");
    await waitFor(() => expect(screen.getByText("+ Add")).toBeInTheDocument());
    fireEvent.click(screen.getByText("+ Add"));
    await waitFor(() => expect(screen.getByText("Create new anyway")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Create new anyway"));

    await waitFor(() => {
      expect(mockCreateMedia).toHaveBeenLastCalledWith(
        expect.objectContaining({ externalId: "550" }),
        true,
      );
    });
    expect(onSelect).toHaveBeenCalledWith({ id: "media-99", title: "Fight Club" });
  });

  it("shows an error message when createMedia fails", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });
    mockCreateMedia.mockResolvedValue({ status: "error", message: "Not authenticated" });
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("fight club");
    await waitFor(() => expect(screen.getByText("+ Add")).toBeInTheDocument());
    fireEvent.click(screen.getByText("+ Add"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Not authenticated");
    });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/components/media-picker.test.tsx`
Expected: FAIL — `Cannot find module '@/components/media-picker'`

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/media-picker.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  searchCatalog,
  searchTmdb,
  createMedia,
  type CatalogResult,
  type TmdbResult,
  type DuplicateCandidate,
  type CreateMediaInput,
} from "@/lib/actions/media";

const TYPE_LABELS: Record<string, string> = {
  movie: "Movie",
  tv_show: "TV Show",
};

export interface MediaPickerSelection {
  id: string;
  title: string;
}

interface MediaPickerProps {
  /** Pre-fill the search query (e.g. from the catalog search page). */
  initialQuery?: string;
  /** Media IDs to render as already-added (e.g. items already in the target list). */
  disabledIds?: Set<string>;
  /** Called once a catalog Media record (existing or newly created) has been resolved. */
  onSelect: (media: MediaPickerSelection) => void;
}

export function MediaPicker({ initialQuery = "", disabledIds, onSelect }: MediaPickerProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [catalogResults, setCatalogResults] = React.useState<CatalogResult[]>([]);
  const [catalogSearching, setCatalogSearching] = React.useState(false);
  const [tmdbResults, setTmdbResults] = React.useState<TmdbResult[]>([]);
  const [tmdbSearching, setTmdbSearching] = React.useState(false);
  const [tmdbError, setTmdbError] = React.useState<string | null>(null);
  const [addedKeys, setAddedKeys] = React.useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [duplicates, setDuplicates] = React.useState<DuplicateCandidate[]>([]);
  const [pendingInput, setPendingInput] = React.useState<CreateMediaInput | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isAdded = React.useCallback(
    (key: string) => addedKeys.has(key) || (disabledIds?.has(key) ?? false),
    [addedKeys, disabledIds],
  );

  // ── Search: catalog first, TMDB fallback on zero catalog results ──────
  React.useEffect(() => {
    clearTimeout(debounceRef.current);
    setActionError(null);
    setDuplicates([]);
    setPendingInput(null);

    if (!query.trim()) {
      setCatalogResults([]);
      setCatalogSearching(false);
      setTmdbResults([]);
      setTmdbSearching(false);
      setTmdbError(null);
      return;
    }

    setCatalogSearching(true);
    setTmdbResults([]);
    setTmdbError(null);

    debounceRef.current = setTimeout(async () => {
      const catalog = await searchCatalog(query);
      setCatalogResults(catalog);
      setCatalogSearching(false);

      if (catalog.length === 0) {
        setTmdbSearching(true);
        const tmdb = await searchTmdb(query);
        setTmdbSearching(false);
        if (tmdb.status === "ok") {
          setTmdbResults(tmdb.results);
        } else if (tmdb.status === "error") {
          setTmdbError(tmdb.message);
        }
      }
    }, 300);

    return () => clearTimeout(debounceRef.current!);
  }, [query]);

  // ── Selection ───────────────────────────────────────────────────────

  function selectCatalogItem(item: CatalogResult) {
    if (isAdded(item.id)) return;
    setAddedKeys((prev) => new Set(prev).add(item.id));
    onSelect({ id: item.id, title: item.title });
  }

  async function resolveCreateMedia(input: CreateMediaInput, force: boolean, key: string, title: string) {
    setSavingKey(key);
    setActionError(null);
    const result = await createMedia(input, force);
    setSavingKey(null);

    if (result.status === "error") {
      setActionError(result.message);
      return;
    }

    if (result.status === "duplicates") {
      setDuplicates(result.candidates);
      setPendingInput(input);
      return;
    }

    setDuplicates([]);
    setPendingInput(null);
    setAddedKeys((prev) => new Set(prev).add(key));
    onSelect({ id: result.mediaId, title });
  }

  async function selectTmdbItem(item: TmdbResult, force = false) {
    if (savingKey || isAdded(item.externalId)) return;
    await resolveCreateMedia(
      {
        title: item.title,
        type: item.type,
        year: item.year ?? undefined,
        externalId: item.externalId,
        posterPath: item.posterPath ?? undefined,
      },
      force,
      item.externalId,
      item.title,
    );
  }

  function useDuplicate(candidate: DuplicateCandidate) {
    setDuplicates([]);
    setPendingInput(null);
    setAddedKeys((prev) => new Set(prev).add(candidate.id));
    onSelect({ id: candidate.id, title: candidate.title });
  }

  function createAnyway() {
    if (!pendingInput) return;
    const key = pendingInput.externalId ?? "manual";
    void resolveCreateMedia(pendingInput, true, key, pendingInput.title);
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 h-full">
      <input
        autoFocus
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title…"
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 shrink-0"
      />

      {duplicates.length > 0 && pendingInput && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40 shrink-0"
        >
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
            Similar items already exist. Did you mean one of these?
          </p>
          <ul className="space-y-2 mb-3">
            {duplicates.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2">
                <span className="text-sm text-amber-800 dark:text-amber-300">
                  {d.title}
                  {d.year ? ` (${d.year})` : ""}
                  {" · "}
                  <span className="capitalize">{(TYPE_LABELS[d.type] ?? d.type).replace("_", " ")}</span>
                </span>
                <Button type="button" size="sm" variant="outline" onClick={() => useDuplicate(d)}>
                  Use this
                </Button>
              </li>
            ))}
          </ul>
          <Button type="button" size="sm" variant="outline" onClick={createAnyway}>
            Create new anyway
          </Button>
        </div>
      )}

      {actionError && (
        <p role="alert" className="text-sm text-destructive shrink-0">
          {actionError}
        </p>
      )}

      <div className="flex-1 overflow-y-auto -mx-4">
        {catalogSearching && <p className="text-sm text-muted-foreground px-4 py-3">Searching…</p>}

        {!catalogSearching && catalogResults.length > 0 && (
          <ul className="divide-y divide-border">
            {catalogResults.map((item) => {
              const added = isAdded(item.id);
              return (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {TYPE_LABELS[item.type] ?? item.type}
                      {item.year ? ` · ${item.year}` : ""}
                      {item.creator ? ` · ${item.creator}` : ""}
                    </p>
                  </div>
                  {added ? (
                    <span className="text-xs text-muted-foreground shrink-0">Added ✓</span>
                  ) : (
                    <Button size="xs" variant="outline" onClick={() => selectCatalogItem(item)}>
                      + Add
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!catalogSearching && catalogResults.length === 0 && (
          <>
            {tmdbSearching && <p className="text-sm text-muted-foreground px-4 py-3">Searching…</p>}

            {!tmdbSearching && tmdbError && (
              <p role="alert" className="text-sm text-destructive px-4 py-3">
                {tmdbError}
              </p>
            )}

            {!tmdbSearching && !tmdbError && tmdbResults.length > 0 && (
              <ul className="divide-y divide-border">
                {tmdbResults.map((item) => {
                  const added = isAdded(item.externalId);
                  return (
                    <li key={item.externalId} className="flex items-center gap-3 px-4 py-3">
                      {item.posterUrl ? (
                        <img
                          src={item.posterUrl}
                          alt=""
                          className="h-16 w-11 rounded object-cover shrink-0 bg-muted"
                        />
                      ) : (
                        <div className="h-16 w-11 rounded bg-muted shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {TYPE_LABELS[item.type] ?? item.type}
                          {item.year ? ` · ${item.year}` : ""}
                        </p>
                      </div>
                      {added ? (
                        <span className="text-xs text-muted-foreground shrink-0">Added ✓</span>
                      ) : (
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          disabled={savingKey === item.externalId}
                          onClick={() => selectTmdbItem(item)}
                        >
                          {savingKey === item.externalId ? "Adding…" : "+ Add"}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {!tmdbSearching && !tmdbError && tmdbResults.length === 0 && query.trim() && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
          </>
        )}

        {!query.trim() && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            Type to search movies and TV shows
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/components/media-picker.test.tsx`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/media-picker.tsx tests/components/media-picker.test.tsx
git commit -m "feat: add MediaPicker with catalog/TMDB search and duplicate resolution"
```

---

### Task 2: MediaPicker — manual entry fallback

**Files:**
- Modify: `src/components/media-picker.tsx`
- Test: `tests/components/media-picker.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/media-picker.test.tsx` (inside the existing `describe("MediaPicker", ...)` block, after the last test):

```tsx
  it("shows a manual-entry link, pre-filled with the current query", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "empty" });

    render(<MediaPicker onSelect={vi.fn()} />);
    await typeQuery("Some Obscure Title");

    await waitFor(() => {
      expect(screen.getByText(/Not finding it\? Add manually/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Not finding it\? Add manually/i));

    expect(screen.getByLabelText(/^Title/)).toHaveValue("Some Obscure Title");
  });

  it("creates the media item via the manual form and calls onSelect", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "empty" });
    mockCreateMedia.mockResolvedValue({ status: "created", mediaId: "media-7" });
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("Some Obscure Title");
    await waitFor(() => screen.getByText(/Not finding it\? Add manually/i));
    fireEvent.click(screen.getByText(/Not finding it\? Add manually/i));

    fireEvent.click(screen.getByRole("button", { name: "Movie" }));
    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: "2021" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to catalog" }));

    await waitFor(() => {
      expect(mockCreateMedia).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Some Obscure Title", type: "movie", year: "2021" }),
        false,
      );
    });
    expect(onSelect).toHaveBeenCalledWith({ id: "media-7", title: "Some Obscure Title" });
  });

  it("returns to the search step after a successful manual submission", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "empty" });
    mockCreateMedia.mockResolvedValue({ status: "created", mediaId: "media-7" });

    render(<MediaPicker onSelect={vi.fn()} />);
    await typeQuery("Some Obscure Title");
    await waitFor(() => screen.getByText(/Not finding it\? Add manually/i));
    fireEvent.click(screen.getByText(/Not finding it\? Add manually/i));
    fireEvent.click(screen.getByRole("button", { name: "Add to catalog" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by title/i)).toBeInTheDocument();
    });
  });

  it("shows duplicate candidates from the manual form and supports 'Use this'", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "empty" });
    mockCreateMedia.mockResolvedValue({
      status: "duplicates",
      candidates: [
        { id: "media-existing", title: "Some Obscure Title", year: null, creator: null, type: "movie" },
      ],
    });
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("Some Obscure Title");
    await waitFor(() => screen.getByText(/Not finding it\? Add manually/i));
    fireEvent.click(screen.getByText(/Not finding it\? Add manually/i));
    fireEvent.click(screen.getByRole("button", { name: "Add to catalog" }));

    await waitFor(() => {
      expect(screen.getByText(/Similar items already exist/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Use this"));

    expect(onSelect).toHaveBeenCalledWith({ id: "media-existing", title: "Some Obscure Title" });
  });
```

Also add `"empty"` as a possible `searchTmdb` mock resolution — confirm the existing `@/lib/actions/media` mock factory doesn't need changes (it doesn't; `searchTmdb` is `vi.fn()` and each test sets its own resolved value).

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `pnpm test tests/components/media-picker.test.tsx`
Expected: FAIL — `Not finding it? Add manually` text not found (manual entry doesn't exist yet)

- [ ] **Step 3: Extend the implementation**

Add these imports to `src/components/media-picker.tsx`:

```tsx
import { MediaType } from "@prisma/client";
import { cn } from "@/lib/utils";
```

Add this helper near the top, alongside `TYPE_LABELS`:

```tsx
const TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: "movie", label: "Movie" },
  { value: "tv_show", label: "TV Show" },
];

function creatorLabel(type: MediaType): string {
  return type === "movie" ? "Director" : "Creator / Showrunner";
}

interface SeasonRow {
  number: number;
  title: string;
}
```

Inside `MediaPicker`, add this state alongside the existing state:

```tsx
  const [step, setStep] = React.useState<"search" | "manual">("search");
  const [manualTitle, setManualTitle] = React.useState("");
  const [manualType, setManualType] = React.useState<MediaType>("movie");
  const [manualYear, setManualYear] = React.useState("");
  const [manualCreator, setManualCreator] = React.useState("");
  const [seasonsOpen, setSeasonsOpen] = React.useState(false);
  const [seasons, setSeasons] = React.useState<SeasonRow[]>([{ number: 1, title: "" }]);
  const [manualSubmitting, setManualSubmitting] = React.useState(false);
```

Update `resolveCreateMedia` and `useDuplicate` so a successful manual submission returns to the search step. Change:

```tsx
    setDuplicates([]);
    setPendingInput(null);
    setAddedKeys((prev) => new Set(prev).add(key));
    onSelect({ id: result.mediaId, title });
  }
```

to:

```tsx
    setDuplicates([]);
    setPendingInput(null);
    setAddedKeys((prev) => new Set(prev).add(key));
    onSelect({ id: result.mediaId, title });

    if (step === "manual") {
      resetManualForm();
      setStep("search");
    }
  }
```

and change `useDuplicate`:

```tsx
  function useDuplicate(candidate: DuplicateCandidate) {
    setDuplicates([]);
    setPendingInput(null);
    setAddedKeys((prev) => new Set(prev).add(candidate.id));
    onSelect({ id: candidate.id, title: candidate.title });

    if (step === "manual") {
      resetManualForm();
      setStep("search");
    }
  }
```

Add these handlers after `createAnyway`:

```tsx
  // ── Manual entry ────────────────────────────────────────────────────

  function openManualEntry() {
    setManualTitle(query.trim());
    setDuplicates([]);
    setPendingInput(null);
    setActionError(null);
    setStep("manual");
  }

  function resetManualForm() {
    setManualTitle("");
    setManualType("movie");
    setManualYear("");
    setManualCreator("");
    setSeasonsOpen(false);
    setSeasons([{ number: 1, title: "" }]);
  }

  function addSeasonRow() {
    setSeasons((prev) => [
      ...prev,
      { number: prev.length > 0 ? prev[prev.length - 1].number + 1 : 1, title: "" },
    ]);
  }

  function removeSeasonRow(index: number) {
    setSeasons((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSeasonRow(index: number, field: keyof SeasonRow, value: string | number) {
    setSeasons((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  async function submitManual(force: boolean) {
    setManualSubmitting(true);
    const input: CreateMediaInput = {
      title: manualTitle,
      type: manualType,
      year: manualYear,
      creator: manualCreator || undefined,
      seasons:
        seasonsOpen && manualType === "tv_show" ? seasons.filter((s) => s.number > 0) : undefined,
    };
    await resolveCreateMedia(input, force, "manual", manualTitle);
    setManualSubmitting(false);
  }
```

Add the manual-entry link to the search-step render, just before the final closing `</div>` of the component's returned JSX:

```tsx
      <div className="shrink-0 pt-2 border-t text-center">
        <button
          type="button"
          onClick={openManualEntry}
          className="text-sm text-primary hover:underline underline-offset-2"
        >
          Not finding it? Add manually →
        </button>
      </div>
    </div>
  );
}
```

(This replaces the previous final `</div>\n  );\n}`.)

Finally, wrap the existing `return (...)` so the manual step renders instead when `step === "manual"`. Change the start of the render section from:

```tsx
  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 h-full">
```

to:

```tsx
  // ── Render ──────────────────────────────────────────────────────────

  if (step === "manual") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setStep("search")}
          className="self-start text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to search
        </button>

        {duplicates.length > 0 && (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40"
          >
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
              Similar items already exist. Did you mean one of these?
            </p>
            <ul className="space-y-2 mb-3">
              {duplicates.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-amber-800 dark:text-amber-300">
                    {d.title}
                    {d.year ? ` (${d.year})` : ""}
                    {" · "}
                    <span className="capitalize">{(TYPE_LABELS[d.type] ?? d.type).replace("_", " ")}</span>
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={() => useDuplicate(d)}>
                    Use this
                  </Button>
                </li>
              ))}
            </ul>
            <Button type="button" size="sm" variant="outline" onClick={createAnyway}>
              Create new anyway
            </Button>
          </div>
        )}

        {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitManual(duplicates.length > 0);
          }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="media-picker-title" className="text-sm font-medium">
              Title <span aria-hidden="true" className="text-destructive">*</span>
            </label>
            <input
              id="media-picker-title"
              type="text"
              required
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="e.g. Dune"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              Type <span aria-hidden="true" className="text-destructive">*</span>
            </span>
            <div role="group" aria-label="Media type" className="inline-flex rounded-lg border border-input overflow-hidden">
              {TYPE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setManualType(value)}
                  className={cn(
                    "flex-1 px-3 py-1.5 text-sm font-medium transition-colors outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    manualType === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-muted",
                  )}
                  aria-pressed={manualType === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="media-picker-year" className="text-sm font-medium">
              Year <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <input
              id="media-picker-year"
              type="number"
              min={1800}
              max={2200}
              value={manualYear}
              onChange={(e) => setManualYear(e.target.value)}
              className="h-9 w-32 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="e.g. 2021"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="media-picker-creator" className="text-sm font-medium">
              {creatorLabel(manualType)} <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <input
              id="media-picker-creator"
              type="text"
              value={manualCreator}
              onChange={(e) => setManualCreator(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder={creatorLabel(manualType)}
            />
          </div>

          {manualType === "tv_show" && (
            <div className="rounded-lg border border-input">
              <button
                type="button"
                onClick={() => setSeasonsOpen((v) => !v)}
                aria-expanded={seasonsOpen}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors rounded-lg"
              >
                <span>Define seasons</span>
              </button>

              {seasonsOpen && (
                <div className="border-t px-3 pb-3 pt-2 flex flex-col gap-2">
                  {seasons.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={row.number}
                        onChange={(e) => updateSeasonRow(i, "number", Number(e.target.value))}
                        aria-label={`Season ${i + 1} number`}
                        className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                      />
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => updateSeasonRow(i, "title", e.target.value)}
                        placeholder="Season title (optional)"
                        aria-label={`Season ${i + 1} title`}
                        className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                      />
                      {seasons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSeasonRow(i)}
                          aria-label={`Remove season ${row.number}`}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addSeasonRow} className="mt-1 text-sm text-primary hover:underline text-left">
                    + Add another season
                  </button>
                </div>
              )}
            </div>
          )}

          <Button type="submit" disabled={manualSubmitting} className="w-full">
            {manualSubmitting ? "Saving…" : duplicates.length > 0 ? "No, create new item anyway" : "Add to catalog"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/components/media-picker.test.tsx`
Expected: PASS (13 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/media-picker.tsx tests/components/media-picker.test.tsx
git commit -m "feat: add manual-entry fallback to MediaPicker"
```

---

### Task 3: Rewrite AddToListSearchModal as a thin MediaPicker wrapper

**Files:**
- Modify: `src/components/add-to-list-search-modal.tsx`
- Modify: `tests/components/add-to-list-search-modal.test.tsx`

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `tests/components/add-to-list-search-modal.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AddToListSearchModal } from "@/components/add-to-list-search-modal";

vi.mock("@/components/media-picker", () => ({
  MediaPicker: ({ onSelect, disabledIds }: { onSelect: (m: { id: string; title: string }) => void; disabledIds?: Set<string> }) => (
    <div>
      <span data-testid="disabled-count">{disabledIds?.size ?? 0}</span>
      <button onClick={() => onSelect({ id: "media-99", title: "Fight Club" })}>select-result</button>
    </div>
  ),
}));

vi.mock("@/lib/actions/list", () => ({
  addToList: vi.fn(),
}));

vi.mock("@/components/ui/toaster", () => ({
  toastManager: { add: vi.fn() },
}));

import { addToList } from "@/lib/actions/list";
import { toastManager } from "@/components/ui/toaster";

const mockAddToList = vi.mocked(addToList);
const mockToastAdd = vi.mocked(toastManager.add);

function renderModal(props: Partial<Parameters<typeof AddToListSearchModal>[0]> = {}) {
  return render(
    <AddToListSearchModal
      listId="list-1"
      listName="Watchlist"
      existingMediaIds={new Set(["media-1"])}
      open={true}
      onOpenChange={vi.fn()}
      onAdded={vi.fn()}
      {...props}
    />,
  );
}

describe("AddToListSearchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes existingMediaIds to MediaPicker as disabledIds", () => {
    renderModal();
    expect(screen.getByTestId("disabled-count")).toHaveTextContent("1");
  });

  it("adds the selected media to the list and shows a toast", async () => {
    mockAddToList.mockResolvedValue({ status: "added", listName: "Watchlist" });
    const onAdded = vi.fn();
    renderModal({ onAdded });

    fireEvent.click(screen.getByText("select-result"));

    await waitFor(() => {
      expect(mockAddToList).toHaveBeenCalledWith("list-1", "media-99");
    });
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Added "Fight Club" to Watchlist' }),
    );
    expect(onAdded).toHaveBeenCalled();
  });

  it("does not toast or call onAdded when the item is already in the list", async () => {
    mockAddToList.mockResolvedValue({ status: "already_exists" });
    const onAdded = vi.fn();
    renderModal({ onAdded });

    fireEvent.click(screen.getByText("select-result"));

    await waitFor(() => {
      expect(mockAddToList).toHaveBeenCalledWith("list-1", "media-99");
    });
    expect(mockToastAdd).not.toHaveBeenCalled();
    expect(onAdded).not.toHaveBeenCalled();
  });

  it("shows an error toast when addToList fails", async () => {
    mockAddToList.mockResolvedValue({ status: "error", message: "Not authenticated" });
    renderModal();

    fireEvent.click(screen.getByText("select-result"));

    await waitFor(() => {
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Not authenticated", type: "error" }),
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/components/add-to-list-search-modal.test.tsx`
Expected: FAIL — `existingMediaIds` no longer reaches a `MediaPicker`; current component renders the old inline search UI instead.

- [ ] **Step 3: Rewrite the component**

Replace the entire contents of `src/components/add-to-list-search-modal.tsx`:

```tsx
"use client";

import { Modal, ModalContent } from "@/components/ui/modal";
import { addToList } from "@/lib/actions/list";
import { MediaPicker, type MediaPickerSelection } from "@/components/media-picker";
import { toastManager } from "@/components/ui/toaster";

interface AddToListSearchModalProps {
  listId: string;
  listName: string;
  existingMediaIds: Set<string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddToListSearchModal({
  listId,
  listName,
  existingMediaIds,
  open,
  onOpenChange,
  onAdded,
}: AddToListSearchModalProps) {
  async function handleSelect(media: MediaPickerSelection) {
    const result = await addToList(listId, media.id);
    if (result.status === "added") {
      toastManager.add({ title: `Added "${media.title}" to ${listName}` });
      onAdded();
    } else if (result.status === "error") {
      toastManager.add({ title: result.message, type: "error" });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent title={`Add to ${listName}`} description="Search the catalog and add items to this list">
        <MediaPicker key={open ? "open" : "closed"} disabledIds={existingMediaIds} onSelect={handleSelect} />
      </ModalContent>
    </Modal>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/components/add-to-list-search-modal.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Run the full test suite to catch regressions**

Run: `pnpm test`
Expected: PASS — no other file imports the removed internals of `add-to-list-search-modal.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/components/add-to-list-search-modal.tsx tests/components/add-to-list-search-modal.test.tsx
git commit -m "refactor: rebuild AddToListSearchModal on MediaPicker"
```

---

### Task 4: Rewrite AddMediaModal as a thin MediaPicker wrapper

**Files:**
- Modify: `src/components/add-media-modal.tsx`
- Create: `tests/components/add-media-modal.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// tests/components/add-media-modal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddMediaModal } from "@/components/add-media-modal";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/components/media-picker", () => ({
  MediaPicker: ({
    onSelect,
    initialQuery,
  }: {
    onSelect: (m: { id: string; title: string }) => void;
    initialQuery?: string;
  }) => (
    <div>
      <span data-testid="initial-query">{initialQuery}</span>
      <button onClick={() => onSelect({ id: "media-99", title: "Fight Club" })}>select-result</button>
    </div>
  ),
}));

function renderModal(props: Partial<Parameters<typeof AddMediaModal>[0]> = {}) {
  return render(<AddMediaModal open={true} onOpenChange={vi.fn()} {...props} />);
}

describe("AddMediaModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes initialTitle to MediaPicker as the initial query", () => {
    renderModal({ initialTitle: "Fight Club" });
    expect(screen.getByTestId("initial-query")).toHaveTextContent("Fight Club");
  });

  it("closes the modal and navigates to the media page when no onCreated callback is given", () => {
    const onOpenChange = vi.fn();
    renderModal({ onOpenChange });

    fireEvent.click(screen.getByText("select-result"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockPush).toHaveBeenCalledWith("/media/media-99");
  });

  it("calls onCreated instead of navigating when provided", () => {
    const onCreated = vi.fn();
    const onOpenChange = vi.fn();
    renderModal({ onCreated, onOpenChange });

    fireEvent.click(screen.getByText("select-result"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onCreated).toHaveBeenCalledWith("media-99");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/components/add-media-modal.test.tsx`
Expected: FAIL — current `AddMediaModal` doesn't render `MediaPicker` or accept these prop shapes the same way.

- [ ] **Step 3: Rewrite the component**

Replace the entire contents of `src/components/add-media-modal.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Modal, ModalContent } from "@/components/ui/modal";
import { MediaPicker, type MediaPickerSelection } from "@/components/media-picker";

interface AddMediaModalProps {
  /** Controlled open state */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill the search query (e.g. from the catalog search page) */
  initialTitle?: string;
  /**
   * When set, after the item is resolved the modal fires this callback
   * instead of navigating to the item's page.
   */
  onCreated?: (mediaId: string) => void;
}

export function AddMediaModal({ open, onOpenChange, initialTitle = "", onCreated }: AddMediaModalProps) {
  const router = useRouter();

  function handleSelect(media: MediaPickerSelection) {
    onOpenChange(false);
    if (onCreated) {
      onCreated(media.id);
    } else {
      router.push(`/media/${media.id}`);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent title="Add new item" description="Search for a movie or TV show, or add it to the catalog">
        <MediaPicker key={open ? "open" : "closed"} initialQuery={initialTitle} onSelect={handleSelect} />
      </ModalContent>
    </Modal>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/components/add-media-modal.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Run the full test suite to catch regressions**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/add-media-modal.tsx tests/components/add-media-modal.test.tsx
git commit -m "refactor: rebuild AddMediaModal on MediaPicker"
```

---

### Task 5: Validate posterPath in createMedia

**Files:**
- Modify: `src/lib/actions/media.ts`
- Modify: `tests/media-actions.test.ts`

- [ ] **Step 1: Write the failing tests**

In `tests/media-actions.test.ts`, update the `vi.mock("@/lib/prisma", ...)` block to add `create` and `findMany` on `media`:

```ts
vi.mock("@/lib/prisma", () => ({
  prisma: {
    media: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    season: {
      createMany: vi.fn(),
    },
  },
}));
```

Add this import alongside the existing ones:

```ts
import { MediaType } from "@prisma/client";
```

Add `mockCreate` and `mockFindMany` alongside the other mocked functions:

```ts
const mockCreate = vi.mocked(prisma.media.create);
const mockFindMany = vi.mocked(prisma.media.findMany);
```

Update the import of the action under test:

```ts
import { backfillPosterPath, createMedia } from "@/lib/actions/media";
```

Add a new top-level describe block, after the closing `});` of `describe("backfillPosterPath", ...)`:

```ts
describe("createMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
  });

  it("rejects a posterPath that doesn't look like a TMDB path", async () => {
    const result = await createMedia({
      title: "Fight Club",
      type: MediaType.movie,
      externalId: "550",
      posterPath: "javascript:alert(1)",
    });

    expect(result.status).toBe("error");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("accepts a posterPath that matches the TMDB path format", async () => {
    mockFindMany.mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreate.mockResolvedValue({ id: "media-1" } as any);

    const result = await createMedia({
      title: "Fight Club",
      type: MediaType.movie,
      externalId: "550",
      posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    });

    expect(result).toEqual({ status: "created", mediaId: "media-1" });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" }),
      }),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `pnpm test tests/media-actions.test.ts`
Expected: FAIL — "rejects a posterPath that doesn't look like a TMDB path" fails because `createMedia` currently accepts any string and calls `prisma.media.create`.

- [ ] **Step 3: Move the regex and apply it in the schema**

In `src/lib/actions/media.ts`, move the `TMDB_POSTER_PATH_RE` definition from its current location (just above `backfillPosterPath`) to just above `createMediaSchema`, and reference it from the schema's `posterPath` field.

Change:

```ts
const createMediaSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  type: z.nativeEnum(MediaType),
  year: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int().min(1800).max(2200).optional(),
  ),
  creator: z.string().max(500).optional(),
  seasons: z.array(seasonRowSchema).optional(),
  externalId: z.string().optional(),
  posterPath: z.string().optional(),
});
```

to:

```ts
// TMDB poster paths look like "/abc123XYZ.jpg" — guard against persisting anything else.
const TMDB_POSTER_PATH_RE = /^\/[\w-]+\.(jpg|jpeg|png)$/i;

const createMediaSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  type: z.nativeEnum(MediaType),
  year: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int().min(1800).max(2200).optional(),
  ),
  creator: z.string().max(500).optional(),
  seasons: z.array(seasonRowSchema).optional(),
  externalId: z.string().optional(),
  posterPath: z.string().regex(TMDB_POSTER_PATH_RE, "Invalid poster path").optional(),
});
```

Then remove the now-duplicate definition just above `backfillPosterPath`. Change:

```ts
// ── Poster backfill ───────────────────────────────────────────────────────────

// TMDB poster paths look like "/abc123XYZ.jpg" — guard against persisting anything else.
const TMDB_POSTER_PATH_RE = /^\/[\w-]+\.(jpg|jpeg|png)$/i;

export type BackfillPosterResult =
```

to:

```ts
// ── Poster backfill ───────────────────────────────────────────────────────────

export type BackfillPosterResult =
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/media-actions.test.ts`
Expected: PASS (8 tests — 6 existing `backfillPosterPath` + 2 new `createMedia`)

- [ ] **Step 5: Run the full test suite to catch regressions**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/actions/media.ts tests/media-actions.test.ts
git commit -m "fix: validate posterPath format in createMedia, not just backfill"
```

---

### Task 6: Document the Media Picker in CONTEXT.md

**Files:**
- Modify: `CONTEXT.md`

- [ ] **Step 1: Add the new term**

In `CONTEXT.md`, add a new term to the `## Language` section, after the **Log (verb)** entry (around line 51) and before `## Public surface area`:

```markdown

**Media Picker**:
The shared search-and-resolve UI for attaching a movie or TV show to a **List** or to the catalog: searches the catalog first, falls back to TMDB results when the catalog has no match, and offers manual entry when neither finds the title. Used by both the "Add to list" flow and the "Add new item to catalog" flow.
_Avoid_: search modal, add dialog
```

- [ ] **Step 2: Commit**

```bash
git add CONTEXT.md
git commit -m "docs: add Media Picker to the domain glossary"
```

---

## Self-review

**Spec coverage:**
- TMDB-result → Media resolution unified (Task 1) ✓
- Catalog-first-everywhere (Task 1 search effect runs for both modals via shared component) ✓
- Manual-entry-everywhere (Task 2) ✓
- AddToListSearchModal: multi-select, stays open, `disabledIds` from `existingMediaIds` (Task 3) ✓
- AddMediaModal: single-select, closes/navigates on first pick (Task 4 — no `addedKeys`-driven UI changes needed since the modal closes immediately) ✓
- posterPath validation gap closed in `createMedia` (Task 5) ✓
- New domain term documented (Task 6) ✓

**Type consistency:** `MediaPickerSelection { id, title }` is the single shape returned by `onSelect` across catalog selection, TMDB creation, duplicate resolution, and manual creation — and is what both wrapper components consume. `CreateMediaInput`, `CatalogResult`, `TmdbResult`, `DuplicateCandidate` are re-used unchanged from `@/lib/actions/media`.

**Placeholder scan:** none — every task ships working, tested code.
