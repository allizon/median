"use client";

import { Button } from "@/components/ui/button";
import type { DuplicateCandidate } from "@/lib/actions/media";
import { TYPE_LABELS } from "./types";

interface DuplicateResolverProps {
  duplicates: DuplicateCandidate[];
  onSelectDuplicate: (candidate: DuplicateCandidate) => void;
  onForceCreate: () => void;
}

export function DuplicateResolver({
  duplicates,
  onSelectDuplicate,
  onForceCreate,
}: DuplicateResolverProps) {
  return (
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
            <Button type="button" size="sm" variant="outline" onClick={() => onSelectDuplicate(d)}>
              Use this
            </Button>
          </li>
        ))}
      </ul>
      <Button type="button" size="sm" variant="outline" onClick={onForceCreate}>
        Create new anyway
      </Button>
    </div>
  );
}
