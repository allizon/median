"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ListSheet } from "@/components/list-sheet";

interface NewListButtonProps {
  className?: string;
}

export function NewListButton({ className }: NewListButtonProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "text-xs font-medium text-primary hover:underline underline-offset-2 transition-colors cursor-pointer",
          className,
        )}
      >
        + New list
      </button>
      <ListSheet
        open={open}
        onOpenChange={setOpen}
        onSuccess={(id) => router.push(`/lists/${id}`)}
      />
    </>
  );
}
