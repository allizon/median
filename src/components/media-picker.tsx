"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { MediaType } from "@prisma/client";
import { cn } from "@/lib/utils";
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

const TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: "movie", label: "Movie" },
  { value: "tv_show", label: "TV Show" },
];

function creatorLabel(type: MediaType): string {
  return type === "movie" ? "Director" : "Creator / Showrunner";
}

interface SeasonRow {
  id: number;
  number: number;
  title: string;
}

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

  const [step, setStep] = React.useState<"search" | "manual">("search");
  const [manualTitle, setManualTitle] = React.useState("");
  const [manualType, setManualType] = React.useState<MediaType>("movie");
  const [manualYear, setManualYear] = React.useState("");
  const [manualCreator, setManualCreator] = React.useState("");
  const nextSeasonId = React.useRef(0);
  const [seasonsOpen, setSeasonsOpen] = React.useState(false);
  const [seasons, setSeasons] = React.useState<SeasonRow[]>([{ id: nextSeasonId.current++, number: 1, title: "" }]);
  const [manualSubmitting, setManualSubmitting] = React.useState(false);

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

    if (step === "manual") {
      resetManualForm();
      setStep("search");
    }
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

  function selectDuplicate(candidate: DuplicateCandidate) {
    setDuplicates([]);
    setAddedKeys((prev) => {
      const next = new Set(prev).add(candidate.id);
      if (pendingInput?.externalId) next.add(pendingInput.externalId);
      return next;
    });
    setPendingInput(null);
    onSelect({ id: candidate.id, title: candidate.title });

    if (step === "manual") {
      resetManualForm();
      setStep("search");
    }
  }

  function createAnyway() {
    if (!pendingInput) return;
    const key = pendingInput.externalId ?? "manual";
    void resolveCreateMedia(pendingInput, true, key, pendingInput.title);
  }

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
    setSeasons([{ id: nextSeasonId.current++, number: 1, title: "" }]);
  }

  function addSeasonRow() {
    setSeasons((prev) => [
      ...prev,
      { id: nextSeasonId.current++, number: prev.length > 0 ? prev[prev.length - 1].number + 1 : 1, title: "" },
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
                  <Button type="button" size="sm" variant="outline" onClick={() => selectDuplicate(d)}>
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
                    <div key={row.id} className="flex items-center gap-2">
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
                <Button type="button" size="sm" variant="outline" onClick={() => selectDuplicate(d)}>
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
