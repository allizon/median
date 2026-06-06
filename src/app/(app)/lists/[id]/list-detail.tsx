"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import type { ListVisibility } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ListSheet } from "@/components/list-sheet";
import { toastManager } from "@/components/ui/toaster";
import { removeListItem, deleteList, setListItemScore, clearListItemScore } from "@/lib/actions/list";
import { AddToListSearchSheet } from "@/components/add-to-list-search-sheet";

const VISIBILITY_LABELS: Record<ListVisibility, string> = {
  private: "Private",
  friends: "Friends",
  public: "Public",
};

const TYPE_LABELS: Record<string, string> = {
  movie: "Movie",
  tv_show: "TV Show",
};

export type ListItem = {
  id: string;
  addedAt: Date;
  score: number | null;
  media: {
    id: string;
    title: string;
    type: string;
    year: number | null;
    creator: string | null;
  };
};

interface ListDetailProps {
  list: {
    id: string;
    name: string;
    visibility: ListVisibility;
    isDefaultWishlist: boolean;
  };
  initialItems: ListItem[];
}

const UNDO_DELAY_MS = 5000;

export function ListDetail({ list: initialList, initialItems }: ListDetailProps) {
  const router = useRouter();
  const [list, setList] = React.useState(initialList);
  const [items, setItems] = React.useState(initialItems);
  const [editOpen, setEditOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [savingScore, setSavingScore] = React.useState<string | null>(null); // listItemId
  const pendingRemovals = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Sort items: score desc, unscored items treated as neutral (2), then by addedAt
  const sortedItems = React.useMemo(
    () =>
      [...items].sort((a, b) => {
        const sa = a.score ?? 2;
        const sb = b.score ?? 2;
        if (sb !== sa) return sb - sa;
        return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      }),
    [items],
  );

  function handleRemove(item: ListItem) {
    // Optimistically hide
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    // Defer the actual deletion
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
      title: `Removed "${item.media.title}"`,
      actionProps: {
        children: "Undo",
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

  async function handleScore(item: ListItem, score: number) {
    if (savingScore === item.id) return;
    const newScore = item.score === score ? null : score;
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, score: newScore } : i)),
    );
    setSavingScore(item.id);
    const result =
      newScore === null
        ? await clearListItemScore(item.id)
        : await setListItemScore(item.id, newScore);
    setSavingScore(null);
    if (result.status === "error") {
      toastManager.add({ title: result.message, type: "error" });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, score: item.score } : i)),
      );
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteList(list.id);
    setDeleting(false);
    if (result.status === "deleted") {
      setDeleteOpen(false);
      router.push("/");
    } else {
      toastManager.add({ title: result.message, type: "error" });
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold truncate">{list.name}</h1>
            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {VISIBILITY_LABELS[list.visibility]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            + Add items
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          {!list.isDefaultWishlist && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="text-destructive hover:text-destructive hover:border-destructive hover:bg-destructive/10"
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Items */}
      {sortedItems.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
          <p className="text-muted-foreground">Nothing here yet.</p>
          <Link
            href="/search"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Find something to add
          </Link>
        </div>
      ) : (
        <ul className="space-y-1">
          {sortedItems.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3"
            >
              {/* Media info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.media.title}</p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABELS[item.media.type] ?? item.media.type}
                  {item.media.year ? ` · ${item.media.year}` : ""}
                  {item.media.creator ? ` · ${item.media.creator}` : ""}
                </p>
              </div>

              {/* Score picker */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground select-none" title="Rate your enthusiasm (0 = low, 4 = high). Click again to clear.">
                  Priority
                </span>
              <div
                className="flex items-center gap-0.5"
                aria-label="Priority score 0–4 (click again to clear)"
              >
                {[0, 1, 2, 3, 4].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleScore(item, s)}
                    disabled={savingScore === item.id}
                    aria-label={`Score ${s}${item.score === s ? " (active, tap to clear)" : ""}`}
                    className={[
                      "w-8 h-8 rounded-md text-xs font-medium transition-colors cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                      item.score === s
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    {s}
                  </button>
                ))}
              </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/media/${item.media.id}`}
                  className="rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add items Sheet */}
      <AddToListSearchSheet
        listId={list.id}
        listName={list.name}
        existingMediaIds={new Set(items.map((i) => i.media.id))}
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={() => router.refresh()}
      />

      {/* Edit Sheet */}
      <ListSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        list={list}
        onSuccess={() => {
          // Refresh list header data from server
          router.refresh();
        }}
      />

      {/* Delete confirm dialog */}
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-150" />
          <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl max-w-sm w-full p-6 space-y-4">
              <Dialog.Title className="text-base font-semibold">Delete "{list.name}"?</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                This will permanently delete the list and all its items. This cannot be undone.
              </Dialog.Description>
              <div className="flex justify-end gap-2">
                <Dialog.Close
                  className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-3 h-8 text-sm font-medium hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cancel
                </Dialog.Close>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Deleting…" : "Delete list"}
                </Button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
