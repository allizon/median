"use client";

import { Button } from "@/components/ui/button";
import type { CatalogResult } from "@/lib/actions/media";
import { TYPE_LABELS, type MediaPickerModeProps } from "./types";

interface CatalogSearchModeProps extends MediaPickerModeProps {
  results: CatalogResult[];
  searching: boolean;
}

export function CatalogSearchMode({
  results,
  searching,
  addedKeys,
  disabledKeys,
  onSelect,
}: CatalogSearchModeProps) {
  if (searching) {
    return <p className="text-sm text-muted-foreground px-4 py-3">Searching…</p>;
  }

  if (results.length === 0) return null;

  return (
    <ul className="divide-y divide-border">
      {results.map((item) => {
        const added = addedKeys.has(item.id) || disabledKeys.has(item.id);
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
              <Button
                size="xs"
                variant="outline"
                onClick={() => onSelect({ id: item.id, title: item.title })}
              >
                + Add
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
