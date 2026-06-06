"use client";

import * as React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { addToList } from "@/lib/actions/list";
import { searchCatalog, type CatalogResult } from "@/lib/actions/media";
import { toastManager } from "@/components/ui/toaster";

const TYPE_LABELS: Record<string, string> = {
  movie: "Movie",
  tv_show: "TV Show",
};

interface AddToListSearchSheetProps {
  listId: string;
  listName: string;
  existingMediaIds: Set<string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddToListSearchSheet({
  listId,
  listName,
  existingMediaIds,
  open,
  onOpenChange,
  onAdded,
}: AddToListSearchSheetProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<CatalogResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [added, setAdded] = React.useState<Set<string>>(new Set());
  const [adding, setAdding] = React.useState<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setAdded(new Set());
    }
  }, [open]);

  React.useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchCatalog(query);
      setResults(r);
      setSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current!);
  }, [query]);

  async function handleAdd(item: CatalogResult) {
    if (adding || added.has(item.id) || existingMediaIds.has(item.id)) return;
    setAdding(item.id);
    const result = await addToList(listId, item.id);
    setAdding(null);
    if (result.status === "added" || result.status === "already_exists") {
      setAdded((prev) => new Set(prev).add(item.id));
      if (result.status === "added") {
        toastManager.add({ title: `Added "${item.title}" to ${listName}` });
        onAdded();
      }
    } else {
      toastManager.add({ title: result.message, type: "error" });
    }
  }

  const isAdded = (mediaId: string) => added.has(mediaId) || existingMediaIds.has(mediaId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={`Add to ${listName}`} description="Search the catalog and add items to this list">
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
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adding it to the catalog first via{" "}
                  <a href="/search" className="text-primary hover:underline underline-offset-2">Search</a>.
                </p>
              </div>
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
      </SheetContent>
    </Sheet>
  );
}
