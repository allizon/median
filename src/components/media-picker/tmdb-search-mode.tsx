"use client";

import { Button } from "@/components/ui/button";
import type { TmdbResult } from "@/lib/actions/media";
import { TYPE_LABELS, type MediaPickerModeProps, type CatalogIntent } from "./types";

interface TmdbSearchModeProps extends MediaPickerModeProps {
  results: TmdbResult[];
  searching: boolean;
  error: string | null;
}

export function TmdbSearchMode({
  results,
  searching,
  error,
  addedKeys,
  disabledKeys,
  savingKey,
  onAddToCatalog,
}: TmdbSearchModeProps) {
  if (searching) {
    return <p className="text-sm text-muted-foreground px-4 py-3">Searching…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive px-4 py-3">
        {error}
      </p>
    );
  }

  if (results.length === 0) return null;

  return (
    <ul className="divide-y divide-border">
      {results.map((item) => {
        const added = addedKeys.has(item.externalId) || disabledKeys.has(item.externalId);
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
                onClick={() =>
                  onAddToCatalog({
                    input: {
                      title: item.title,
                      type: item.type,
                      year: item.year ?? undefined,
                      externalId: item.externalId,
                      posterPath: item.posterPath ?? undefined,
                    },
                    key: item.externalId,
                    title: item.title,
                  } satisfies CatalogIntent)
                }
              >
                {savingKey === item.externalId ? "Adding…" : "+ Add"}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
