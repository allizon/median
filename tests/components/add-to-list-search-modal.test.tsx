import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AddToListSearchModal } from "@/components/add-to-list-search-modal";

vi.mock("@/lib/actions/media", () => ({
  searchCatalog: vi.fn(),
  searchTmdb: vi.fn(),
  createMedia: vi.fn(),
}));

vi.mock("@/lib/actions/list", () => ({
  addToList: vi.fn(),
}));

vi.mock("@/components/ui/toaster", () => ({
  toastManager: { add: vi.fn() },
}));

import { searchCatalog, searchTmdb, createMedia } from "@/lib/actions/media";
import { addToList } from "@/lib/actions/list";
import { toastManager } from "@/components/ui/toaster";

const mockSearchCatalog = vi.mocked(searchCatalog);
const mockSearchTmdb = vi.mocked(searchTmdb);
const mockCreateMedia = vi.mocked(createMedia);
const mockAddToList = vi.mocked(addToList);
const mockToastAdd = vi.mocked(toastManager.add);

const TMDB_MOVIE = {
  externalId: "550",
  title: "Fight Club",
  year: 1999,
  type: "movie" as const,
  posterPath: "/poster.jpg",
  posterUrl: "https://image.tmdb.org/t/p/w185/poster.jpg",
};

function renderModal(props: Partial<Parameters<typeof AddToListSearchModal>[0]> = {}) {
  return render(
    <AddToListSearchModal
      listId="list-1"
      listName="Watchlist"
      existingMediaIds={new Set()}
      open={true}
      onOpenChange={vi.fn()}
      onAdded={vi.fn()}
      {...props}
    />,
  );
}

async function typeQuery(query: string) {
  fireEvent.change(screen.getByPlaceholderText(/search by title/i), { target: { value: query } });
}

describe("AddToListSearchModal - TMDB fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddToList.mockResolvedValue({ status: "added", listName: "Watchlist" });
  });

  it("shows TMDB results when the catalog search returns nothing", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });

    renderModal();
    await typeQuery("fight club");

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
    });
    expect(screen.getByText(/Movie/)).toBeInTheDocument();
    expect(screen.getByText(/1999/)).toBeInTheDocument();
  });

  it("creates the media item and adds it to the list when a TMDB result is selected", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });
    mockCreateMedia.mockResolvedValue({ status: "created", mediaId: "media-99" });

    const onAdded = vi.fn();
    renderModal({ onAdded });
    await typeQuery("fight club");

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("+ Add"));

    await waitFor(() => {
      expect(mockCreateMedia).toHaveBeenCalledWith(
        {
          title: "Fight Club",
          type: "movie",
          year: 1999,
          externalId: "550",
          posterPath: "/poster.jpg",
        },
        false,
      );
    });
    expect(mockAddToList).toHaveBeenCalledWith("list-1", "media-99");
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Added "Fight Club" to Watchlist' }),
    );
    expect(onAdded).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText("Added ✓")).toBeInTheDocument();
    });
  });

  it("shows duplicate candidates and adds the existing item via 'Use this'", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });
    mockCreateMedia.mockResolvedValue({
      status: "duplicates",
      candidates: [
        { id: "media-existing", title: "Fight Club", year: 1999, creator: "David Fincher", type: "movie" },
      ],
    });

    renderModal();
    await typeQuery("fight club");
    await waitFor(() => expect(screen.getByText("+ Add")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ Add"));

    await waitFor(() => {
      expect(screen.getByText(/Similar items already exist/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Use this"));

    await waitFor(() => {
      expect(mockAddToList).toHaveBeenCalledWith("list-1", "media-existing");
    });
    expect(mockCreateMedia).toHaveBeenCalledTimes(1);
  });

  it("force-creates and adds when 'Create new anyway' is selected", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });
    mockCreateMedia
      .mockResolvedValueOnce({
        status: "duplicates",
        candidates: [
          { id: "media-existing", title: "Fight Club", year: 1999, creator: "David Fincher", type: "movie" },
        ],
      })
      .mockResolvedValueOnce({ status: "created", mediaId: "media-99" });

    renderModal();
    await typeQuery("fight club");
    await waitFor(() => expect(screen.getByText("+ Add")).toBeInTheDocument());
    fireEvent.click(screen.getByText("+ Add"));
    await waitFor(() => expect(screen.getByText("Create new anyway")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Create new anyway"));

    await waitFor(() => {
      expect(mockCreateMedia).toHaveBeenLastCalledWith(
        expect.objectContaining({ externalId: "550" }),
        true,
      );
    });
    expect(mockAddToList).toHaveBeenCalledWith("list-1", "media-99");
  });

  it("shows an error message when the TMDB search fails", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "error", message: "Search failed. Please try again." });

    renderModal();
    await typeQuery("fight club");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Search failed. Please try again.");
    });
    expect(screen.queryByText(/No results for/)).not.toBeInTheDocument();
  });

  it("does not call TMDB when the catalog search returns results", async () => {
    mockSearchCatalog.mockResolvedValue([
      { id: "media-1", title: "Fight Club", type: "movie", year: 1999, creator: "David Fincher" },
    ]);

    renderModal();
    await typeQuery("fight club");

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
    });
    expect(screen.getByText("+ Add")).toBeInTheDocument();
    expect(mockSearchTmdb).not.toHaveBeenCalled();
  });
});
