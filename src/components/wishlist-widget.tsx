"use client";

import * as React from "react";
import Link from "next/link";
import { removeListItem } from "@/lib/actions/list";
import { toastManager } from "@/components/ui/toaster";

const TYPE_LABELS: Record<string, string> = {
  movie: "Movie",
  tv_show: "TV Show",
};

export type WishlistItem = {
  id: string; // listItemId
  media: {
    id: string;
    title: string;
    type: string;
    year: number | null;
    creator: string | null;
  };
};

interface WishlistWidgetProps {
  initialItems: WishlistItem[];
  wishlistId: string | null;
}

const UNDO_DELAY_MS = 5000;

export function WishlistWidget({ initialItems, wishlistId }: WishlistWidgetProps) {
  const [items, setItems] = React.useState(initialItems);
  const pendingRemovals = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function scheduleRemove(item: WishlistItem, label: string, undoLabel: string) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    const timerId = setTimeout(async () => {
      pendingRemovals.current.delete(item.id);
      const result = await removeListItem(item.id);
      if (result.status === "error") {
        toastManager.add({ title: result.message, type: "error" });
        setItems((prev) => [...prev, item]);
      }
    }, UNDO_DELAY_MS);

    pendingRemovals.current.set(item.id, timerId);

    toastManager.add({
      title: label,
      actionProps: {
        children: undoLabel,
        onClick: () => {
          const tid = pendingRemovals.current.get(item.id);
          if (tid !== undefined) {
            clearTimeout(tid);
            pendingRemovals.current.delete(item.id);
          }
          setItems((prev) => [...prev, item]);
        },
      },
      timeout: UNDO_DELAY_MS,
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Nothing in your Wishlist yet.{" "}
        <Link href="/search" className="text-primary underline-offset-4 hover:underline">
          Search to add something →
        </Link>
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border -mx-4">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.media.title}</p>
            <p className="text-xs text-muted-foreground">
              {TYPE_LABELS[item.media.type] ?? item.media.type}
              {item.media.year ? ` · ${item.media.year}` : ""}
              {item.media.creator ? ` · ${item.media.creator}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => scheduleRemove(item, `Marked "${item.media.title}" as watched`, "Undo")}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
            >
              Watched it
            </button>
            <button
              type="button"
              onClick={() => scheduleRemove(item, `Removed "${item.media.title}"`, "Undo")}
              className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
