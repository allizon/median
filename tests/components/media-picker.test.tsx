import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaPicker } from "@/components/media-picker";

vi.mock("@/lib/actions/media", () => ({
  searchCatalog: vi.fn(),
  searchTmdb: vi.fn(),
  createMedia: vi.fn(),
}));

import { searchCatalog, searchTmdb, createMedia } from "@/lib/actions/media";

const mockSearchCatalog = vi.mocked(searchCatalog);
const mockSearchTmdb = vi.mocked(searchTmdb);
const mockCreateMedia = vi.mocked(createMedia);

const TMDB_MOVIE = {
  externalId: "550",
  title: "Fight Club",
  year: 1999,
  type: "movie" as const,
  posterPath: "/poster.jpg",
  posterUrl: "https://image.tmdb.org/t/p/w185/poster.jpg",
};

const CATALOG_ITEM = {
  id: "media-1",
  title: "Fight Club",
  type: "movie" as const,
  year: 1999,
  creator: "David Fincher",
};

async function typeQuery(query: string) {
  fireEvent.change(screen.getByPlaceholderText(/search by title/i), { target: { value: query } });
}

describe("MediaPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows catalog results and does not call TMDB when the catalog has matches", async () => {
    mockSearchCatalog.mockResolvedValue([CATALOG_ITEM]);

    render(<MediaPicker onSelect={vi.fn()} />);
    await typeQuery("fight club");

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
    });
    expect(screen.getByText("+ Add")).toBeInTheDocument();
    expect(mockSearchTmdb).not.toHaveBeenCalled();
  });

  it("falls back to TMDB when the catalog search returns nothing", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });

    render(<MediaPicker onSelect={vi.fn()} />);
    await typeQuery("fight club");

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
    });
    expect(screen.getByText(/Movie/)).toBeInTheDocument();
    expect(screen.getByText(/1999/)).toBeInTheDocument();
  });

  it("shows an error message when the TMDB search fails", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "error", message: "Search failed. Please try again." });

    render(<MediaPicker onSelect={vi.fn()} />);
    await typeQuery("fight club");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Search failed. Please try again.");
    });
  });

  it("marks catalog items in disabledIds as already added and ignores clicks on them", async () => {
    mockSearchCatalog.mockResolvedValue([CATALOG_ITEM]);
    const onSelect = vi.fn();

    render(<MediaPicker disabledIds={new Set(["media-1"])} onSelect={onSelect} />);
    await typeQuery("fight club");

    await waitFor(() => {
      expect(screen.getByText("Added ✓")).toBeInTheDocument();
    });
    expect(screen.queryByText("+ Add")).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("calls onSelect directly when a catalog item is chosen, and marks it Added", async () => {
    mockSearchCatalog.mockResolvedValue([CATALOG_ITEM]);
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("fight club");
    await waitFor(() => expect(screen.getByText("+ Add")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ Add"));

    expect(onSelect).toHaveBeenCalledWith({ id: "media-1", title: "Fight Club" });
    expect(mockCreateMedia).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("Added ✓")).toBeInTheDocument());
  });

  it("creates the media item and calls onSelect when a TMDB result is chosen", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });
    mockCreateMedia.mockResolvedValue({ status: "created", mediaId: "media-99" });
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("fight club");
    await waitFor(() => expect(screen.getByText("+ Add")).toBeInTheDocument());

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
    expect(onSelect).toHaveBeenCalledWith({ id: "media-99", title: "Fight Club" });
    await waitFor(() => expect(screen.getByText("Added ✓")).toBeInTheDocument());
  });

  it("shows duplicate candidates and calls onSelect with the existing item via 'Use this'", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });
    mockCreateMedia.mockResolvedValue({
      status: "duplicates",
      candidates: [
        { id: "media-existing", title: "Fight Club", year: 1999, creator: "David Fincher", type: "movie" },
      ],
    });
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("fight club");
    await waitFor(() => expect(screen.getByText("+ Add")).toBeInTheDocument());
    fireEvent.click(screen.getByText("+ Add"));

    await waitFor(() => {
      expect(screen.getByText(/Similar items already exist/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Use this"));

    expect(onSelect).toHaveBeenCalledWith({ id: "media-existing", title: "Fight Club" });
    expect(mockCreateMedia).toHaveBeenCalledTimes(1);
  });

  it("marks the originating TMDB row as Added after resolving via 'Use this'", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });
    mockCreateMedia.mockResolvedValue({
      status: "duplicates",
      candidates: [
        { id: "media-existing", title: "Fight Club", year: 1999, creator: "David Fincher", type: "movie" },
      ],
    });
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("fight club");
    await waitFor(() => expect(screen.getByText("+ Add")).toBeInTheDocument());

    const resultsList = screen.getByText("Fight Club").closest("ul")!;
    fireEvent.click(within(resultsList).getByText("+ Add"));

    await waitFor(() => {
      expect(screen.getByText(/Similar items already exist/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Use this"));

    await waitFor(() => {
      expect(within(resultsList).getByText("Added ✓")).toBeInTheDocument();
    });
    expect(within(resultsList).queryByText("+ Add")).not.toBeInTheDocument();
  });

  it("force-creates and calls onSelect when 'Create new anyway' is chosen", async () => {
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
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
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
    expect(onSelect).toHaveBeenCalledWith({ id: "media-99", title: "Fight Club" });
  });

  it("shows an error message when createMedia fails", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "ok", results: [TMDB_MOVIE] });
    mockCreateMedia.mockResolvedValue({ status: "error", message: "Not authenticated" });
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("fight club");
    await waitFor(() => expect(screen.getByText("+ Add")).toBeInTheDocument());
    fireEvent.click(screen.getByText("+ Add"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Not authenticated");
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a manual-entry link, pre-filled with the current query", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "empty" });

    render(<MediaPicker onSelect={vi.fn()} />);
    await typeQuery("Some Obscure Title");

    await waitFor(() => {
      expect(screen.getByText(/Not finding it\? Add manually/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Not finding it\? Add manually/i));

    expect(screen.getByLabelText(/^Title/)).toHaveValue("Some Obscure Title");
  });

  it("creates the media item via the manual form and calls onSelect", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "empty" });
    mockCreateMedia.mockResolvedValue({ status: "created", mediaId: "media-7" });
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("Some Obscure Title");
    await waitFor(() => screen.getByText(/Not finding it\? Add manually/i));
    fireEvent.click(screen.getByText(/Not finding it\? Add manually/i));

    fireEvent.click(screen.getByRole("button", { name: "Movie" }));
    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: "2021" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to catalog" }));

    await waitFor(() => {
      expect(mockCreateMedia).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Some Obscure Title", type: "movie", year: "2021" }),
        false,
      );
    });
    expect(onSelect).toHaveBeenCalledWith({ id: "media-7", title: "Some Obscure Title" });
  });

  it("returns to the search step after a successful manual submission", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "empty" });
    mockCreateMedia.mockResolvedValue({ status: "created", mediaId: "media-7" });

    render(<MediaPicker onSelect={vi.fn()} />);
    await typeQuery("Some Obscure Title");
    await waitFor(() => screen.getByText(/Not finding it\? Add manually/i));
    fireEvent.click(screen.getByText(/Not finding it\? Add manually/i));
    fireEvent.click(screen.getByRole("button", { name: "Add to catalog" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by title/i)).toBeInTheDocument();
    });
  });

  it("shows duplicate candidates from the manual form and supports 'Use this'", async () => {
    mockSearchCatalog.mockResolvedValue([]);
    mockSearchTmdb.mockResolvedValue({ status: "empty" });
    mockCreateMedia.mockResolvedValue({
      status: "duplicates",
      candidates: [
        { id: "media-existing", title: "Some Obscure Title", year: null, creator: null, type: "movie" },
      ],
    });
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);
    await typeQuery("Some Obscure Title");
    await waitFor(() => screen.getByText(/Not finding it\? Add manually/i));
    fireEvent.click(screen.getByText(/Not finding it\? Add manually/i));
    fireEvent.click(screen.getByRole("button", { name: "Add to catalog" }));

    await waitFor(() => {
      expect(screen.getByText(/Similar items already exist/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Use this"));

    expect(onSelect).toHaveBeenCalledWith({ id: "media-existing", title: "Some Obscure Title" });
  });
});

describe("MediaPicker — SeasonRow stable keys", () => {
  it("adds and removes season rows without mixing up data", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);

    await user.click(screen.getByText("Not finding it? Add manually →"));
    await user.click(screen.getByText("TV Show"));
    await user.click(screen.getByText("Define seasons"));

    const seasonNumberInputs = screen.getAllByLabelText(/Season \d+ number/);
    expect(seasonNumberInputs).toHaveLength(1);

    await user.click(screen.getByText("+ Add another season"));
    expect(screen.getAllByLabelText(/Season \d+ number/)).toHaveLength(2);

    const titleInputs = screen.getAllByLabelText(/Season \d+ title/);
    await user.type(titleInputs[0], "First Season");
    await user.type(titleInputs[1], "Second Season");
    expect(titleInputs[0]).toHaveValue("First Season");
    expect(titleInputs[1]).toHaveValue("Second Season");

    const removeButtons = screen.getAllByLabelText(/Remove season/);
    await user.click(removeButtons[0]);

    const remainingTitles = screen.getAllByLabelText(/Season \d+ title/);
    expect(remainingTitles).toHaveLength(1);
    expect(remainingTitles[0]).toHaveValue("Second Season");
  });

  it("keeps correct number values after removing a middle row", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<MediaPicker onSelect={onSelect} />);

    await user.click(screen.getByText("Not finding it? Add manually →"));
    await user.click(screen.getByText("TV Show"));
    await user.click(screen.getByText("Define seasons"));

    await user.click(screen.getByText("+ Add another season"));
    await user.click(screen.getByText("+ Add another season"));
    expect(screen.getAllByLabelText(/Season \d+ number/)).toHaveLength(3);

    const numberInputs = screen.getAllByLabelText(/Season \d+ number/);
    await user.clear(numberInputs[0]);
    await user.type(numberInputs[0], "5");
    await user.clear(numberInputs[1]);
    await user.type(numberInputs[1], "10");
    await user.clear(numberInputs[2]);
    await user.type(numberInputs[2], "15");

    const removeButtons = screen.getAllByLabelText(/Remove season/);
    await user.click(removeButtons[1]);

    const remainingNumbers = screen.getAllByLabelText(/Season \d+ number/);
    expect(remainingNumbers).toHaveLength(2);
    expect(remainingNumbers[0]).toHaveValue(5);
    expect(remainingNumbers[1]).toHaveValue(15);
  });
});
