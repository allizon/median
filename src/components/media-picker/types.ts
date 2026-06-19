import type { MediaType } from "@prisma/client";
import type { CreateMediaInput } from "@/lib/actions/media";

export interface MediaPickerSelection {
  id: string;
  title: string;
}

export interface CatalogIntent {
  input: CreateMediaInput;
  key: string;
  title: string;
}

export interface MediaPickerModeProps {
  addedKeys: Set<string>;
  disabledKeys: Set<string>;
  savingKey: string | null;
  onSelect: (media: MediaPickerSelection) => void;
  onAddToCatalog: (intent: CatalogIntent) => void;
}

export const TYPE_LABELS: Record<string, string> = {
  movie: "Movie",
  tv_show: "TV Show",
};

export const TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: "movie", label: "Movie" },
  { value: "tv_show", label: "TV Show" },
];

export function creatorLabel(type: MediaType): string {
  return type === "movie" ? "Director" : "Creator / Showrunner";
}

export interface SeasonRow {
  id: number;
  number: number;
  title: string;
}
