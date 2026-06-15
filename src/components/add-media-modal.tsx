"use client";

import { useRouter } from "next/navigation";
import { Modal, ModalContent } from "@/components/ui/modal";
import { MediaPicker, type MediaPickerSelection } from "@/components/media-picker";

interface AddMediaModalProps {
  /** Controlled open state */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill the search query (e.g. from the catalog search page) */
  initialTitle?: string;
  /**
   * When set, after the item is resolved the modal fires this callback
   * instead of navigating to the item's page.
   */
  onCreated?: (mediaId: string) => void;
}

export function AddMediaModal({ open, onOpenChange, initialTitle = "", onCreated }: AddMediaModalProps) {
  const router = useRouter();

  function handleSelect(media: MediaPickerSelection) {
    onOpenChange(false);
    if (onCreated) {
      onCreated(media.id);
    } else {
      router.push(`/media/${media.id}`);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent title="Add new item" description="Search for a movie or TV show, or add it to the catalog">
        <MediaPicker key={open ? "open" : "closed"} initialQuery={initialTitle} onSelect={handleSelect} />
      </ModalContent>
    </Modal>
  );
}
