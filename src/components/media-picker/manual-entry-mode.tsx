"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MediaType } from "@prisma/client";
import { TYPE_OPTIONS, creatorLabel, type CatalogIntent, type SeasonRow } from "./types";

interface ManualEntryModeProps {
  initialTitle: string;
  duplicatesCount: number;
  onAddToCatalog: (intent: CatalogIntent) => void;
}

export function ManualEntryMode({ initialTitle, duplicatesCount, onAddToCatalog }: ManualEntryModeProps) {
  const [title, setTitle] = React.useState(initialTitle);
  const [type, setType] = React.useState<MediaType>("movie");
  const [year, setYear] = React.useState("");
  const [creator, setCreator] = React.useState("");
  const nextSeasonId = React.useRef(0);
  const [seasonsOpen, setSeasonsOpen] = React.useState(false);
  const [seasons, setSeasons] = React.useState<SeasonRow[]>([{ id: nextSeasonId.current++, number: 1, title: "" }]);
  const [submitting, setSubmitting] = React.useState(false);

  // Sync initialTitle when it changes (e.g. when opening manual entry from a query)
  React.useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onAddToCatalog({
      input: {
        title,
        type,
        year: year || undefined,
        creator: creator || undefined,
        seasons:
          seasonsOpen && type === "tv_show" ? seasons.filter((s) => s.number > 0) : undefined,
      },
      key: "manual",
      title,
    });
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="media-picker-year" className="text-sm font-medium">
          Year <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <input
          id="media-picker-year"
          type="number"
          min={1800}
          max={2200}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="h-9 w-32 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="e.g. 2021"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="media-picker-creator" className="text-sm font-medium">
          {creatorLabel(type)} <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <input
          id="media-picker-creator"
          type="text"
          value={creator}
          onChange={(e) => setCreator(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder={creatorLabel(type)}
        />
      </div>

      {type === "tv_show" && (
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

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : duplicatesCount > 0 ? "No, create new item anyway" : "Add to catalog"}
      </Button>
    </form>
  );
}
