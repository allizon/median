"use client";

import * as React from "react";
import type { ListVisibility } from "@prisma/client";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { createList, updateList } from "@/lib/actions/list";
import { toastManager } from "@/components/ui/toaster";

interface ListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the modal is in edit mode */
  list?: {
    id: string;
    name: string;
    visibility: ListVisibility;
    isDefaultWishlist: boolean;
  };
  onSuccess?: (id: string) => void;
}

export function ListModal({ open, onOpenChange, list, onSuccess }: ListModalProps) {
  const isEdit = !!list;
  const isWishlist = list?.isDefaultWishlist ?? false;

  const [name, setName] = React.useState("");
  const [visibility, setVisibility] = React.useState<"private" | "public">("private");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(list?.name ?? "");
    const v = list?.visibility;
    setVisibility(v === "public" ? "public" : "private");
  }, [open, list]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    if (isEdit) {
      const result = await updateList(list.id, {
        name: isWishlist ? undefined : name.trim(),
        visibility,
      });
      setSaving(false);
      if (result.status === "updated") {
        onOpenChange(false);
        toastManager.add({ title: "List updated" });
        onSuccess?.(list.id);
      } else {
        toastManager.add({ title: result.message, type: "error" });
      }
    } else {
      const result = await createList(name.trim(), visibility);
      setSaving(false);
      if (result.status === "created") {
        onOpenChange(false);
        toastManager.add({ title: `Created "${result.name}"` });
        onSuccess?.(result.id);
      } else {
        toastManager.add({ title: result.message, type: "error" });
      }
    }
  }

  const title = isEdit
    ? isWishlist
      ? "Edit Wishlist"
      : "Edit list"
    : "New list";

  const canSubmit = isWishlist ? true : name.trim().length > 0;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent title={title}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {!isWishlist && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Name <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List name"
                maxLength={200}
                required
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Visibility</span>
            <div className="flex flex-col gap-1.5">
              {(["private", "public"] as const).map((v) => (
                <label
                  key={v}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors has-[:checked]:border-ring has-[:checked]:bg-muted"
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={v}
                    checked={visibility === v}
                    onChange={() => setVisibility(v)}
                    className="accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium capitalize">{v === "private" ? "Private" : "Public"}</p>
                    <p className="text-xs text-muted-foreground">
                      {v === "private" ? "Only you can see this list" : "Anyone can view this list"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={saving || !canSubmit} className="w-full">
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create list"}
          </Button>
        </form>
      </ModalContent>
    </Modal>
  );
}
