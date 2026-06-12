"use client";

import * as React from "react";
import { addToWishlist } from "@/lib/actions/list";
import { toastManager } from "@/components/ui/toaster";
import { AddToListModal } from "@/components/add-to-list-modal";
import { cn } from "@/lib/utils";

interface AddToListButtonsProps {
  mediaId: string;
  /** Pre-loaded from server: whether this item is already in the user's Wishlist. */
  inWishlist: boolean;
}

export function AddToListButtons({ mediaId, inWishlist: initialInWishlist }: AddToListButtonsProps) {
  const [inWishlist, setInWishlist] = React.useState(initialInWishlist);
  const [adding, setAdding] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  async function handleAddToWishlist() {
    if (inWishlist || adding) return;
    setAdding(true);
    const result = await addToWishlist(mediaId);
    setAdding(false);
    if (result.status === "added") {
      setInWishlist(true);
      toastManager.add({ title: "Added to Wishlist" });
    } else if (result.status === "already_exists") {
      setInWishlist(true);
    } else {
      toastManager.add({ title: result.message, type: "error" });
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        {/* Add to Wishlist */}
        <button
          type="button"
          onClick={handleAddToWishlist}
          disabled={inWishlist || adding}
          aria-label={inWishlist ? "In Wishlist" : "Add to Wishlist"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            inWishlist
              ? "bg-primary/10 text-primary cursor-default"
              : "bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-60",
          )}
        >
          {inWishlist ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              In Wishlist
            </>
          ) : adding ? (
            "Adding…"
          ) : (
            "Add to Wishlist"
          )}
        </button>

        {/* Add to list… */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Add to list"
          className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="8" x2="21" y1="6" y2="6" />
            <line x1="8" x2="21" y1="12" y2="12" />
            <line x1="8" x2="21" y1="18" y2="18" />
            <line x1="3" x2="3.01" y1="6" y2="6" />
            <line x1="3" x2="3.01" y1="12" y2="12" />
            <line x1="3" x2="3.01" y1="18" y2="18" />
          </svg>
          Lists
        </button>
      </div>

      <AddToListModal mediaId={mediaId} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
