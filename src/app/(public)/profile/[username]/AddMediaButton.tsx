"use client";

import { useState } from "react";
import { AddMediaModal } from "@/components/add-media-modal";

export function AddMediaButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
      >
        + Add Media
      </button>
      <AddMediaModal open={open} onOpenChange={setOpen} />
    </>
  );
}
