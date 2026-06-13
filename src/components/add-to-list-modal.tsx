"use client";

import * as React from "react";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { getUserLists, addToList, createListAndAdd, type UserList } from "@/lib/actions/list";
import { toastManager } from "@/components/ui/toaster";
import { listDisplayName } from "@/lib/labels";

interface AddToListModalProps {
  mediaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToListModal({ mediaId, open, onOpenChange }: AddToListModalProps) {
  const [lists, setLists] = React.useState<UserList[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [adding, setAdding] = React.useState<string | null>(null); // listId being added
  const [showNewList, setShowNewList] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // Fetch lists when modal opens
  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    setShowNewList(false);
    setNewListName("");
    getUserLists(mediaId).then((result) => {
      setLists(result);
      setLoading(false);
    });
  }, [open, mediaId]);

  async function handleAddToList(list: UserList) {
    if (list.hasItem || adding) return;
    setAdding(list.id);
    const result = await addToList(list.id, mediaId);
    setAdding(null);
    if (result.status === "added") {
      onOpenChange(false);
      toastManager.add({ title: `Added to ${result.listName}` });
    } else if (result.status === "already_exists") {
      setLists((prev) =>
        prev.map((l) => (l.id === list.id ? { ...l, hasItem: true } : l))
      );
    } else if (result.status === "error") {
      toastManager.add({ title: result.message, type: "error" });
    }
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim() || creating) return;
    setCreating(true);
    const result = await createListAndAdd(newListName.trim(), mediaId);
    setCreating(false);
    if (result.status === "added") {
      onOpenChange(false);
      toastManager.add({ title: `Added to ${result.listName}` });
    } else {
      toastManager.add({ title: result.status === "error" ? result.message : "Failed to create list", type: "error" });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent title="Add to list" description="Choose a list to add this item to">
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground px-1 py-4">Loading lists…</p>
          ) : (
            <>
              {lists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  disabled={list.hasItem || adding !== null}
                  onClick={() => handleAddToList(list)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors
                    enabled:hover:bg-muted
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {listDisplayName(list)}
                    </p>
                    <p className="text-xs text-muted-foreground">{list.itemCount} items</p>
                  </div>
                  <div className="shrink-0 ml-3">
                    {list.hasItem ? (
                      <span className="text-xs text-muted-foreground">Already added</span>
                    ) : adding === list.id ? (
                      <span className="text-xs text-muted-foreground">Adding…</span>
                    ) : null}
                  </div>
                </button>
              ))}

              {/* New list row */}
              <div className="border-t mt-1 pt-1">
                {showNewList ? (
                  <form onSubmit={handleCreateList} className="flex items-center gap-2 px-3 py-2">
                    <input
                      autoFocus
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="List name"
                      className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                    />
                    <Button type="submit" size="sm" disabled={creating || !newListName.trim()}>
                      {creating ? "…" : "Create"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => { setShowNewList(false); setNewListName(""); }}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewList(true)}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-primary hover:bg-muted transition-colors text-left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14" /><path d="M12 5v14" />
                    </svg>
                    New list…
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
