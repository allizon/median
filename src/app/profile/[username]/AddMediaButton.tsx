"use client";

import { useState } from "react";
import { AddMediaSheet } from "@/components/add-media-sheet";

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
      <AddMediaSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
