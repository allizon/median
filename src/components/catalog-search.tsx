"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { MediaType } from "@prisma/client";
import { AddMediaSheet } from "@/components/add-media-sheet";
import { AddToListButtons } from "@/components/add-to-list-buttons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MediaResult {
  id: string;
  title: string;
  year: number | null;
  creator: string | null;
  type: MediaType;
}

interface CatalogSearchProps {
  query: string;
  typeFilter: MediaType | undefined;
  results: MediaResult[];
  isAuthenticated: boolean;
  wishlistMediaIds: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_FILTERS: { value: MediaType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv_show", label: "TV Shows" },
];

function typeLabel(type: MediaType): string {
  if (type === "movie") return "Movie";
  if (type === "tv_show") return "TV Show";
  return type;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CatalogSearch({
  query: initialQuery,
  typeFilter: initialTypeFilter,
  results,
  isAuthenticated,
  wishlistMediaIds,
}: CatalogSearchProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [inputValue, setInputValue] = React.useState(initialQuery);
  const [addSheetOpen, setAddSheetOpen] = React.useState(false);

  const wishlistSet = React.useMemo(() => new Set(wishlistMediaIds), [wishlistMediaIds]);
  const hasResults = results.length > 0;

  // Push URL params to trigger server re-render with new results
  function search(q: string, type: MediaType | "all") {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type && type !== "all") params.set("type", type);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    search(inputValue, initialTypeFilter ?? "all");
  }

  function handleTypeChange(type: MediaType | "all") {
    search(inputValue, type);
  }

  function handleCreated(mediaId: string) {
    router.push(`/media/${mediaId}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {initialQuery ? `Results for "${initialQuery}"` : "Browse catalog"}
      </h1>

      {/* Search bar */}
      <form onSubmit={handleFormSubmit} className="flex gap-2 mb-4" role="search">
        <input
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search by title…"
          aria-label="Search catalog by title"
          className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit">Search</Button>
      </form>

      {/* Type filter chips */}
      <div
        role="group"
        aria-label="Filter by type"
        className="flex gap-2 flex-wrap mb-6"
      >
        {TYPE_FILTERS.map(({ value, label }) => {
          const active =
            value === "all" ? !initialTypeFilter : initialTypeFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeChange(value)}
              aria-pressed={active ? true : false}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors cursor-pointer",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input bg-background text-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {hasResults ? (
        <ul className="divide-y divide-border rounded-lg border" role="list">
          {results.map((item) => (
            <li key={item.id} className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {typeLabel(item.type)}
                    {item.year ? ` · ${item.year}` : ""}
                    {item.creator ? ` · ${item.creator}` : ""}
                  </p>
                </div>
                <a
                  href={`/media/${item.id}`}
                  className="shrink-0 text-sm text-primary hover:underline"
                >
                  View
                </a>
              </div>
              {isAuthenticated && (
                <AddToListButtons
                  mediaId={item.id}
                  inWishlist={wishlistSet.has(item.id)}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-input py-12 text-center">
          <div>
            <p className="font-medium">No results for &ldquo;{initialQuery}&rdquo;</p>
            <p className="text-sm text-muted-foreground mt-1">
              This item isn&apos;t in the catalog yet.
            </p>
          </div>
          {isAuthenticated && (
            <Button onClick={() => setAddSheetOpen(true)}>
              Add &ldquo;{initialQuery}&rdquo; to catalog
            </Button>
          )}
        </div>
      )}

      {/* Add media slide-over */}
      {isAuthenticated && (
        <AddMediaSheet
          open={addSheetOpen}
          onOpenChange={setAddSheetOpen}
          initialTitle={initialQuery}
          onCreated={handleCreated}
        />
      )}
    </main>
  );
}
