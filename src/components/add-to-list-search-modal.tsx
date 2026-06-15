"use client";

import { Modal, ModalContent } from "@/components/ui/modal";
import { addToList } from "@/lib/actions/list";
import { MediaPicker, type MediaPickerSelection } from "@/components/media-picker";
import { toastManager } from "@/components/ui/toaster";

interface AddToListSearchModalProps {
  listId: string;
  listName: string;
  existingMediaIds: Set<string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddToListSearchModal({
  listId,
  listName,
  existingMediaIds,
  open,
  onOpenChange,
  onAdded,
}: AddToListSearchModalProps) {
  async function handleSelect(media: MediaPickerSelection) {
    const result = await addToList(listId, media.id);
    if (result.status === "added") {
      toastManager.add({ title: `Added "${media.title}" to ${listName}` });
      onAdded();
    } else if (result.status === "error") {
      toastManager.add({ title: result.message, type: "error" });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent title={`Add to ${listName}`} description="Search the catalog and add items to this list">
        <MediaPicker key={open ? "open" : "closed"} disabledIds={existingMediaIds} onSelect={handleSelect} />
      </ModalContent>
    </Modal>
  );
}
