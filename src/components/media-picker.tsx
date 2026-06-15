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
  const searchGenRef = React.useRef(0);

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

    const gen = ++searchGenRef.current;

    debounceRef.current = setTimeout(async () => {
      const catalog = await searchCatalog(query);
      if (searchGenRef.current !== gen) return;
      setCatalogResults(catalog);
      setCatalogSearching(false);

      if (catalog.length === 0) {
        setTmdbSearching(true);
        const tmdb = await searchTmdb(query);
        if (searchGenRef.current !== gen) return;
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
    setAddedKeys((prev) => {
      const next = new Set(prev).add(candidate.id);
      if (pendingInput?.externalId) next.add(pendingInput.externalId);
      return next;
    });
    setPendingInput(null);
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
