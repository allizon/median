import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AddToListSearchModal } from "@/components/add-to-list-search-modal";

vi.mock("@/components/media-picker", () => ({
  MediaPicker: ({ onSelect, disabledIds }: { onSelect: (m: { id: string; title: string }) => void; disabledIds?: Set<string> }) => (
    <div>
      <span data-testid="disabled-count">{disabledIds?.size ?? 0}</span>
      <button onClick={() => onSelect({ id: "media-99", title: "Fight Club" })}>select-result</button>
    </div>
  ),
}));

vi.mock("@/lib/actions/list", () => ({
  addToList: vi.fn(),
}));

vi.mock("@/components/ui/toaster", () => ({
  toastManager: { add: vi.fn() },
}));

import { addToList } from "@/lib/actions/list";
import { toastManager } from "@/components/ui/toaster";

const mockAddToList = vi.mocked(addToList);
const mockToastAdd = vi.mocked(toastManager.add);

function renderModal(props: Partial<Parameters<typeof AddToListSearchModal>[0]> = {}) {
  return render(
    <AddToListSearchModal
      listId="list-1"
      listName="Watchlist"
      existingMediaIds={new Set(["media-1"])}
      open={true}
      onOpenChange={vi.fn()}
      onAdded={vi.fn()}
      {...props}
    />,
  );
}

describe("AddToListSearchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes existingMediaIds to MediaPicker as disabledIds", () => {
    renderModal();
    expect(screen.getByTestId("disabled-count")).toHaveTextContent("1");
  });

  it("adds the selected media to the list and shows a toast", async () => {
    mockAddToList.mockResolvedValue({ status: "added", listName: "Watchlist" });
    const onAdded = vi.fn();
    renderModal({ onAdded });

    fireEvent.click(screen.getByText("select-result"));

    await waitFor(() => {
      expect(mockAddToList).toHaveBeenCalledWith("list-1", "media-99");
    });
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Added "Fight Club" to Watchlist' }),
    );
    expect(onAdded).toHaveBeenCalled();
  });

  it("does not toast or call onAdded when the item is already in the list", async () => {
    mockAddToList.mockResolvedValue({ status: "already_exists" });
    const onAdded = vi.fn();
    renderModal({ onAdded });

    fireEvent.click(screen.getByText("select-result"));

    await waitFor(() => {
      expect(mockAddToList).toHaveBeenCalledWith("list-1", "media-99");
    });
    expect(mockToastAdd).not.toHaveBeenCalled();
    expect(onAdded).not.toHaveBeenCalled();
  });

  it("shows an error toast when addToList fails", async () => {
    mockAddToList.mockResolvedValue({ status: "error", message: "Not authenticated" });
    renderModal();

    fireEvent.click(screen.getByText("select-result"));

    await waitFor(() => {
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Not authenticated", type: "error" }),
      );
    });
  });
});
