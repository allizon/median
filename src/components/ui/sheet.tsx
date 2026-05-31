"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

// ── Sheet (reusable slide-over / bottom-sheet) ────────────────────────────────
//
// On mobile (< md) renders as a full-height bottom sheet.
// On md+ renders as a right-side panel (~480px wide).
//
// Usage:
//   <Sheet open={open} onOpenChange={setOpen}>
//     <SheetContent title="Add item">…</SheetContent>
//   </Sheet>
//
// Or with a trigger:
//   <Sheet>
//     <SheetTrigger><Button>Open</Button></SheetTrigger>
//     <SheetContent title="Add item">…</SheetContent>
//   </Sheet>

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;

interface SheetContentProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function SheetContent({ title, description, children, className }: SheetContentProps) {
  return (
    <Dialog.Portal>
      {/* Backdrop */}
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-200" />

      {/* Panel */}
      <Dialog.Popup
        className={cn(
          // Base
          "fixed z-50 flex flex-col bg-background shadow-xl outline-none",
          // Mobile: full-height bottom sheet, slides up
          "inset-x-0 bottom-0 top-0 rounded-none",
          // md+: right-side panel
          "md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:w-[480px] md:rounded-l-xl",
          // Enter / leave transitions
          "data-[starting-style]:translate-y-full md:data-[starting-style]:translate-x-full md:data-[starting-style]:translate-y-0",
          "data-[ending-style]:translate-y-full md:data-[ending-style]:translate-x-full md:data-[ending-style]:translate-y-0",
          "transition-transform duration-300 ease-in-out",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
          <div>
            <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
                {description}
              </Dialog.Description>
            )}
          </div>
          <Dialog.Close
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Dialog.Close>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

export { Sheet, SheetTrigger, SheetContent };
