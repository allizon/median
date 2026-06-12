"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

// ── Modal (reusable centred dialog) ───────────────────────────────────────────
//
// A centred overlay dialog for short-form interactions (1–2 fields, a
// confirmation). For full-panel slide-overs, use Sheet instead.
//
// Usage:
//   <Modal open={open} onOpenChange={setOpen}>
//     <ModalContent title="New list">…</ModalContent>
//   </Modal>
//
// Or with a trigger:
//   <Modal>
//     <ModalTrigger><Button>Open</Button></ModalTrigger>
//     <ModalContent title="New list">…</ModalContent>
//   </Modal>

const Modal = Dialog.Root;
const ModalTrigger = Dialog.Trigger;

interface ModalContentProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function ModalContent({ title, description, children, className }: ModalContentProps) {
  return (
    <Dialog.Portal>
      {/* Backdrop */}
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-200" />

      {/* Panel */}
      <Dialog.Popup
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card shadow-xl outline-none",
          "max-h-[85vh] flex flex-col",
          "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
          "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
          "transition-all duration-200",
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

export { Modal, ModalTrigger, ModalContent };
