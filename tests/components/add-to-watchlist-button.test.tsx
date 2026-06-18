import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddToWatchlistButton } from "@/components/add-to-watchlist-button";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockModal = vi.hoisted(
  () =>
    vi.fn(({ open, existingMediaIds }: { open: boolean; existingMediaIds: Set<string> }) =>
      open ? `modal-open-${existingMediaIds.size}-disabled` : null,
    ),
);

vi.mock("@/components/add-to-list-search-modal", () => ({
  AddToListSearchModal: mockModal,
}));

function renderButton(props: Partial<Parameters<typeof AddToWatchlistButton>[0]> = {}) {
  return render(
    <AddToWatchlistButton
      wishlistId="wishlist-1"
      existingMediaIds={["media-1", "media-2"]}
      {...props}
    />,
  );
}

describe("AddToWatchlistButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the button with correct label", () => {
    renderButton();
    expect(
      screen.getByRole("button", { name: /add to watchlist/i }),
    ).toBeInTheDocument();
  });

  it("is closed by default", () => {
    renderButton();
    expect(screen.queryByText(/modal-open/)).not.toBeInTheDocument();
  });

  it("opens the modal when clicked", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /add to watchlist/i }));
    expect(screen.getByText(/modal-open/)).toBeInTheDocument();
  });

  it("passes existingMediaIds as a Set to the modal", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /add to watchlist/i }));
    expect(screen.getByText("modal-open-2-disabled")).toBeInTheDocument();
  });

  it("passes the wishlistId and WISHLIST_LABEL to AddToListSearchModal", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /add to watchlist/i }));
    const openCall = mockModal.mock.calls.find((c) => c[0].open === true);
    expect(openCall?.[0]).toMatchObject({ listId: "wishlist-1", listName: "Watchlist" });
  });

  it("calls router.refresh when onAdded is triggered", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /add to watchlist/i }));
    const call = mockModal.mock.calls.find((c) => c[0].open === true);
    const onAdded = call?.[0]?.onAdded;
    onAdded?.();
    expect(mockRefresh).toHaveBeenCalled();
  });
});
