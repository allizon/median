"use client";

import * as React from "react";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { addToList } from "@/lib/actions/list";
import {
  searchCatalog,
  searchTmdb,
  createMedia,
  type CatalogResult,
  type TmdbResult,
  type DuplicateCandidate,
} from "@/lib/actions/media";
import { toastManager } from "@/components/ui/toaster";

const TYPE_LABELS: Record<string, string> = {
  movie: "Movie",
  tv_show: "TV Show",
};

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
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<CatalogResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [added, setAdded] = React.useState<Set<string>>(new Set());
  const [adding, setAdding] = React.useState<string | null>(null);
  const [tmdbResults, setTmdbResults] = React.useState<TmdbResult[]>([]);
  const [tmdbSearching, setTmdbSearching] = React.useState(false);
  const [tmdbError, setTmdbError] = React.useState<string | null>(null);
  const [tmdbAdded, setTmdbAdded] = React.useState<Set<string>>(new Set());
  const [savingTmdbId, setSavingTmdbId] = React.useState<string | null>(null);
  const [tmdbDuplicates, setTmdbDuplicates] = React.useState<DuplicateCandidate[]>([]);
  const [pendingTmdbResult, setPendingTmdbResult] = React.useState<TmdbResult | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setAdded(new Set());
      setTmdbResults([]);
      setTmdbSearching(false);
      setTmdbError(null);
    }
  }, [open]);

  React.useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      setTmdbResults([]);
      setTmdbError(null);
      return;
    }
    setSearching(true);
    setTmdbResults([]);
    setTmdbError(null);
    debounceRef.current = setTimeout(async () => {
      const r = await searchCatalog(query);
      setResults(r);
      setSearching(false);

      if (r.length === 0) {
        setTmdbSearching(true);
        const tr = await searchTmdb(query);
        setTmdbSearching(false);
        if (tr.status === "ok") {
          setTmdbResults(tr.results);
        } else if (tr.status === "error") {
          setTmdbError(tr.message);
        }
      }
    }, 300);
    return () => clearTimeout(debounceRef.current!);
  }, [query]);

  async function addMediaToList(mediaId: string, title: string) {
    const result = await addToList(listId, mediaId);
    if (result.status === "added" || result.status === "already_exists") {
      setAdded((prev) => new Set(prev).add(mediaId));
      if (result.status === "added") {
        toastManager.add({ title: `Added "${title}" to ${listName}` });
        onAdded();
      }
    } else {
      toastManager.add({ title: result.message, type: "error" });
    }
  }

  async function handleAdd(item: CatalogResult) {
    if (adding || added.has(item.id) || existingMediaIds.has(item.id)) return;
    setAdding(item.id);
    await addMediaToList(item.id, item.title);
    setAdding(null);
  }

  async function handleSelectTmdb(item: TmdbResult, force = false) {
    if (savingTmdbId || tmdbAdded.has(item.externalId)) return;
    setSavingTmdbId(item.externalId);
    setTmdbDuplicates([]);

    const r = await createMedia(
      {
        title: item.title,
        type: item.type,
        year: item.year ?? undefined,
        externalId: item.externalId,
        posterPath: item.posterPath ?? undefined,
      },
      force,
    );
    setSavingTmdbId(null);

    if (r.status === "error") {
      toastManager.add({ title: r.message, type: "error" });
      return;
    }

    if (r.status === "duplicates") {
      setPendingTmdbResult(item);
      setTmdbDuplicates(r.candidates);
      return;
    }

    setTmdbAdded((prev) => new Set(prev).add(item.externalId));
    await addMediaToList(r.mediaId, item.title);
  }

  async function handleUseTmdbDuplicate(candidate: DuplicateCandidate) {
    setTmdbDuplicates([]);
    if (pendingTmdbResult) {
      setTmdbAdded((prev) => new Set(prev).add(pendingTmdbResult.externalId));
    }
    setPendingTmdbResult(null);
    await addMediaToList(candidate.id, candidate.title);
  }

  const isAdded = (mediaId: string) => added.has(mediaId) || existingMediaIds.has(mediaId);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent title={`Add to ${listName}`} description="Search the catalog and add items to this list">
        <div className="flex flex-col gap-4 h-full">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title…"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 shrink-0"
          />

          <div className="flex-1 overflow-y-auto -mx-4">
            {searching && (
              <p className="text-sm text-muted-foreground px-4 py-3">Searching…</p>
            )}

            {!searching && query.trim() && results.length === 0 && (
              <>
                {tmdbDuplicates.length > 0 && pendingTmdbResult && (
                  <div
                    role="alert"
                    className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-2 dark:border-amber-800 dark:bg-amber-950/40"
                  >
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
                      Similar items already exist. Did you mean one of these?
                    </p>
                    <ul className="space-y-2 mb-3">
                      {tmdbDuplicates.map((d) => (
                        <li key={d.id} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-amber-800 dark:text-amber-300">
                            {d.title}
                            {d.year ? ` (${d.year})` : ""}
                            {" · "}
                            <span className="capitalize">{(TYPE_LABELS[d.type] ?? d.type).replace("_", " ")}</span>
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleUseTmdbDuplicate(d)}
                          >
                            Use this
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectTmdb(pendingTmdbResult, true)}
                    >
                      Create new anyway
                    </Button>
                  </div>
                )}

                {tmdbSearching && (
                  <p className="text-sm text-muted-foreground px-4 py-3">Searching…</p>
                )}

                {!tmdbSearching && tmdbError && (
                  <p role="alert" className="text-sm text-destructive px-4 py-3">
                    {tmdbError}
                  </p>
                )}

                {!tmdbSearching && !tmdbError && tmdbResults.length > 0 && (
                  <ul className="divide-y divide-border">
                    {tmdbResults.map((item) => (
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
                        {tmdbAdded.has(item.externalId) ? (
                          <span className="text-xs text-muted-foreground shrink-0">Added ✓</span>
                        ) : (
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            disabled={savingTmdbId === item.externalId}
                            onClick={() => handleSelectTmdb(item)}
                          >
                            {savingTmdbId === item.externalId ? "Adding…" : "+ Add"}
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {!tmdbSearching && !tmdbError && tmdbResults.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try adding it to the catalog first via{" "}
                      <a href="/search" className="text-primary hover:underline underline-offset-2">Search</a>.
                    </p>
                  </div>
                )}
              </>
            )}

            {!searching && results.length > 0 && (
              <ul className="divide-y divide-border">
                {results.map((item) => {
                  const alreadyAdded = isAdded(item.id);
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
                      {alreadyAdded ? (
                        <span className="text-xs text-muted-foreground shrink-0">Added ✓</span>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={adding === item.id}
                          onClick={() => handleAdd(item)}
                        >
                          {adding === item.id ? "Adding…" : "+ Add"}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {!query.trim() && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                Type to search movies and TV shows
              </p>
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
