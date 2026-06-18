"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddToListSearchModal } from "@/components/add-to-list-search-modal";
import { WISHLIST_LABEL } from "@/lib/labels";

interface AddToWatchlistButtonProps {
  wishlistId: string;
  existingMediaIds: string[];
}

export function AddToWatchlistButton({ wishlistId, existingMediaIds }: AddToWatchlistButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button size="lg" className="w-full justify-center" onClick={() => setOpen(true)}>
        + Add to Watchlist
      </Button>
      <AddToListSearchModal
        listId={wishlistId}
        listName={WISHLIST_LABEL}
        existingMediaIds={new Set(existingMediaIds)}
        open={open}
        onOpenChange={setOpen}
        onAdded={() => router.refresh()}
      />
    </>
  );
}
