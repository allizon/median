"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MediaType } from "@prisma/client";
import {
  createMedia,
  type DuplicateCandidate,
  type CreateMediaInput,
} from "@/lib/actions/media";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SeasonRow {
  number: number;
  title: string;
}

interface AddMediaSheetProps {
  /** Controlled open state */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill the title field (e.g. from the search query) */
  initialTitle?: string;
  /**
   * When set, after the item is created the sheet will fire this callback
   * instead of navigating to the new item's page.
   * Use for "add to list" intent preservation (MDN-25).
   */
  onCreated?: (mediaId: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: "movie", label: "Movie" },
  { value: "tv_show", label: "TV Show" },
];

function creatorLabel(type: MediaType): string {
  if (type === "movie") return "Director";
  return "Creator / Showrunner";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddMediaSheet({
  open,
  onOpenChange,
  initialTitle = "",
  onCreated,
}: AddMediaSheetProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState(initialTitle);
  const [type, setType] = React.useState<MediaType>("movie");
  const [year, setYear] = React.useState("");
  const [creator, setCreator] = React.useState("");
  const [seasonsOpen, setSeasonsOpen] = React.useState(false);
  const [seasons, setSeasons] = React.useState<SeasonRow[]>([{ number: 1, title: "" }]);
  const [duplicates, setDuplicates] = React.useState<DuplicateCandidate[]>([]);
  const [forcing, setForcing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync title when initialTitle changes (e.g. user runs a new search)
  React.useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  // Reset form state when sheet opens
  React.useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setType("movie");
      setYear("");
      setCreator("");
      setSeasonsOpen(false);
      setSeasons([{ number: 1, title: "" }]);
      setDuplicates([]);
      setForcing(false);
      setError(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Season row helpers ───────────────────────────────────────────────────

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

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(force: boolean) {
    setSubmitting(true);
    setError(null);
    setDuplicates([]);

    const input: CreateMediaInput = {
      title,
      type,
      year: year,
      creator: creator || undefined,
      seasons:
        seasonsOpen && type === "tv_show"
          ? seasons.filter((s) => s.number > 0)
          : undefined,
    };

    const result = await createMedia(input, force);
    setSubmitting(false);

    if (result.status === "error") {
      setError(result.message);
      return;
    }

    if (result.status === "duplicates") {
      setDuplicates(result.candidates);
      setForcing(true);
      return;
    }

    // Created successfully
    onOpenChange(false);
    if (onCreated) {
      onCreated(result.mediaId);
    } else {
      router.push(`/media/${result.mediaId}`);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Add new item" description="Add a movie or TV show to the catalog">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(forcing);
          }}
          className="flex flex-col gap-5"
        >
          {/* Duplicate warning */}
          {duplicates.length > 0 && (
            <div
              role="alert"
              className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40"
            >
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
                Similar items already exist. Did you mean one of these?
              </p>
              <ul className="space-y-2">
                {duplicates.map((d) => (
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
                      onClick={() => {
                        onOpenChange(false);
                        if (onCreated) {
                          onCreated(d.id);
                        } else {
                          router.push(`/media/${d.id}`);
                        }
                      }}
                    >
                      Use this
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error */}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
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
            {forcing && duplicates.length > 0 ? (
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
      </SheetContent>
    </Sheet>
  );
}
