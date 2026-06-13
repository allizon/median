"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MediaType } from "@prisma/client";
import {
  createMedia,
  searchTmdb,
  type DuplicateCandidate,
  type CreateMediaInput,
  type TmdbResult,
} from "@/lib/actions/media";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SeasonRow {
  number: number;
  title: string;
}

interface AddMediaModalProps {
  /** Controlled open state */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill the search query (e.g. from the catalog search page) */
  initialTitle?: string;
  /**
   * When set, after the item is created the modal will fire this callback
   * instead of navigating to the new item's page.
   * Use for "add to list" intent preservation (MDN-25).
   */
  onCreated?: (mediaId: string) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: "movie", label: "Movie" },
  { value: "tv_show", label: "TV Show" },
];

const TYPE_LABELS = Object.fromEntries(TYPE_OPTIONS.map(({ value, label }) => [value, label]));

function creatorLabel(type: MediaType): string {
  return type === "movie" ? "Director" : "Creator / Showrunner";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddMediaModal({
  open,
  onOpenChange,
  initialTitle = "",
  onCreated,
}: AddMediaModalProps) {
  const router = useRouter();

  // ── Step ──────────────────────────────────────────────────────────────
  const [step, setStep] = React.useState<"search" | "manual">("search");

  // ── Search step state ─────────────────────────────────────────────────
  const [query, setQuery] = React.useState(initialTitle);
  const [results, setResults] = React.useState<TmdbResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [pendingResult, setPendingResult] = React.useState<TmdbResult | null>(null);
  const [searchDuplicates, setSearchDuplicates] = React.useState<DuplicateCandidate[]>([]);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchGenRef = React.useRef(0);

  // ── Manual form state ─────────────────────────────────────────────────
  const [title, setTitle] = React.useState(initialTitle);
  const [type, setType] = React.useState<MediaType>("movie");
  const [year, setYear] = React.useState("");
  const [creator, setCreator] = React.useState("");
  const [seasonsOpen, setSeasonsOpen] = React.useState(false);
  const [seasons, setSeasons] = React.useState<SeasonRow[]>([{ number: 1, title: "" }]);
  const [manualDuplicates, setManualDuplicates] = React.useState<DuplicateCandidate[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [manualError, setManualError] = React.useState<string | null>(null);

  // ── Reset on open ─────────────────────────────────────────────────────
  React.useEffect(() => {
    if (open) {
      setStep("search");
      setQuery(initialTitle);
      setResults([]);
      setSearching(false);
      setSavingId(null);
      setPendingResult(null);
      setSearchDuplicates([]);
      setSearchError(null);
      setTitle(initialTitle);
      setType("movie");
      setYear("");
      setCreator("");
      setSeasonsOpen(false);
      setSeasons([{ number: 1, title: "" }]);
      setManualDuplicates([]);
      setSubmitting(false);
      setManualError(null);
      searchGenRef.current += 1;
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── TMDB search debounce ──────────────────────────────────────────────
  React.useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setSearchError(null);
    setSearchDuplicates([]);
    setPendingResult(null);
    const gen = ++searchGenRef.current;
    debounceRef.current = setTimeout(async () => {
      const r = await searchTmdb(query);
      if (searchGenRef.current !== gen) return;
      if (r.status === "ok") {
        setResults(r.results);
      } else if (r.status === "empty") {
        setResults([]);
      } else {
        setSearchError(r.message);
        setResults([]);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current!);
  }, [query]);

  // ── Shared helpers ────────────────────────────────────────────────────

  function finish(mediaId: string) {
    onOpenChange(false);
    if (onCreated) {
      onCreated(mediaId);
    } else {
      router.push(`/media/${mediaId}`);
    }
  }

  // ── Search step handlers ──────────────────────────────────────────────

  async function handleSelectTmdb(result: TmdbResult, force = false) {
    setSavingId(result.externalId);
    setSearchError(null);
    setSearchDuplicates([]);

    const input: CreateMediaInput = {
      title: result.title,
      type: result.type,
      year: result.year ?? undefined,
      externalId: result.externalId,
      posterPath: result.posterPath ?? undefined,
    };

    const r = await createMedia(input, force);
    setSavingId(null);

    if (r.status === "error") {
      setSearchError(r.message);
      return;
    }

    if (r.status === "duplicates") {
      setPendingResult(result);
      setSearchDuplicates(r.candidates);
      return;
    }

    finish(r.mediaId);
  }

  // ── Manual form helpers ───────────────────────────────────────────────

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
    setSeasons((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  async function handleManualSubmit(force: boolean) {
    setSubmitting(true);
    setManualError(null);
    setManualDuplicates([]);

    const input: CreateMediaInput = {
      title,
      type,
      year,
      creator: creator || undefined,
      seasons:
        seasonsOpen && type === "tv_show"
          ? seasons.filter((s) => s.number > 0)
          : undefined,
    };

    const result = await createMedia(input, force);
    setSubmitting(false);

    if (result.status === "error") {
      setManualError(result.message);
      return;
    }

    if (result.status === "duplicates") {
      setManualDuplicates(result.candidates);
      return;
    }

    finish(result.mediaId);
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        title="Add new item"
        description={
          step === "search"
            ? "Search for a movie or TV show"
            : "Add a movie or TV show to the catalog"
        }
      >
        {step === "search" ? (
          // ── Search step ─────────────────────────────────────────────────
          <div className="flex flex-col gap-4 h-full">
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies & TV shows…"
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 shrink-0"
            />

            {/* Duplicate warning */}
            {searchDuplicates.length > 0 && pendingResult && (
              <div
                role="alert"
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40 shrink-0"
              >
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
                  Similar items already exist. Did you mean one of these?
                </p>
                <ul className="space-y-2 mb-3">
                  {searchDuplicates.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-amber-800 dark:text-amber-300">
                        {d.title}
                        {d.year ? ` (${d.year})` : ""}
                        {" · "}
                        <span className="capitalize">{d.type.replace("_", " ")}</span>
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => finish(d.id)}
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
                  onClick={() => handleSelectTmdb(pendingResult, true)}
                >
                  Create new anyway
                </Button>
              </div>
            )}

            {/* Error */}
            {searchError && (
              <p role="alert" className="text-sm text-destructive shrink-0">
                {searchError}
              </p>
            )}

            {/* Results list */}
            <div className="flex-1 overflow-y-auto -mx-4">
              {searching && (
                <p className="text-sm text-muted-foreground px-4 py-3">Searching…</p>
              )}

              {!searching && !searchError && query.trim() && results.length === 0 && !searchDuplicates.length && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                </div>
              )}

              {!searching && results.length > 0 && (
                <ul className="divide-y divide-border">
                  {results.map((item) => (
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
                          {TYPE_LABELS[item.type]}
                          {item.year ? ` · ${item.year}` : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        disabled={savingId === item.externalId}
                        onClick={() => handleSelectTmdb(item)}
                      >
                        {savingId === item.externalId ? "Adding…" : "Add"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              {!query.trim() && (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                  Type to search for a movie or TV show
                </p>
              )}
            </div>

            {/* Fallback to manual entry */}
            <div className="shrink-0 pt-2 border-t text-center">
              <button
                type="button"
                onClick={() => {
                  setTitle(query);
                  setStep("manual");
                }}
                className="text-sm text-primary hover:underline underline-offset-2"
              >
                Not finding it? Add manually →
              </button>
            </div>
          </div>
        ) : (
          // ── Manual form step ─────────────────────────────────────────────
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleManualSubmit(manualDuplicates.length > 0);
            }}
            className="flex flex-col gap-5"
          >
            {/* Back link */}
            <button
              type="button"
              onClick={() => setStep("search")}
              className="self-start flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to search
            </button>

            {/* Duplicate warning */}
            {manualDuplicates.length > 0 && (
              <div
                role="alert"
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40"
              >
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
                  Similar items already exist. Did you mean one of these?
                </p>
                <ul className="space-y-2">
                  {manualDuplicates.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-amber-800 dark:text-amber-300">
                        {d.title}
                        {d.year ? ` (${d.year})` : ""}
                        {" · "}
                        <span className="capitalize">{d.type.replace("_", " ")}</span>
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => finish(d.id)}
                      >
                        Use this
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error */}
            {manualError && (
              <p role="alert" className="text-sm text-destructive">
                {manualError}
              </p>
            )}

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="add-media-title" className="text-sm font-medium">
                Title <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <input
                id="add-media-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="e.g. Dune"
              />
            </div>

            {/* Type — segmented control */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                Type <span aria-hidden="true" className="text-destructive">*</span>
              </span>
              <div
                role="group"
                aria-label="Media type"
                className="inline-flex rounded-lg border border-input overflow-hidden"
              >
                {TYPE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={cn(
                      "flex-1 px-3 py-1.5 text-sm font-medium transition-colors outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      type === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground hover:bg-muted",
                    )}
                    aria-pressed={type === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Year */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="add-media-year" className="text-sm font-medium">
                Year <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                id="add-media-year"
                type="number"
                min={1800}
                max={2200}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-9 w-32 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="e.g. 2021"
              />
            </div>

            {/* Creator */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="add-media-creator" className="text-sm font-medium">
                {creatorLabel(type)}{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                id="add-media-creator"
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder={creatorLabel(type)}
              />
            </div>

            {/* TV Seasons — conditional disclosure */}
            {type === "tv_show" && (
              <div className="rounded-lg border border-input">
                <button
                  type="button"
                  onClick={() => setSeasonsOpen((v) => !v)}
                  aria-expanded={seasonsOpen}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors rounded-lg"
                >
                  <span>Define seasons</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn("transition-transform duration-200", seasonsOpen && "rotate-180")}
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {seasonsOpen && (
                  <div className="border-t px-3 pb-3 pt-2 flex flex-col gap-2">
                    {seasons.map((row, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-xs text-muted-foreground sr-only">
                            Season number
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={row.number}
                            onChange={(e) => updateSeasonRow(i, "number", Number(e.target.value))}
                            aria-label={`Season ${i + 1} number`}
                            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-0.5">
                          <label className="text-xs text-muted-foreground sr-only">
                            Season title (optional)
                          </label>
                          <input
                            type="text"
                            value={row.title}
                            onChange={(e) => updateSeasonRow(i, "title", e.target.value)}
                            placeholder="Season title (optional)"
                            aria-label={`Season ${i + 1} title`}
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                          />
                        </div>
                        {seasons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSeasonRow(i)}
                            aria-label={`Remove season ${row.number}`}
                            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSeasonRow}
                      className="mt-1 text-sm text-primary hover:underline text-left"
                    >
                      + Add another season
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              {manualDuplicates.length > 0 ? (
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Saving…" : "No, create new item anyway"}
                </Button>
              ) : (
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Checking…" : "Add to catalog"}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
