import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    media: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/tmdb", () => ({
  searchTmdb: vi.fn(),
  fetchTmdbDetails: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchTmdbDetails } from "@/lib/tmdb";
import { backfillPosterPath } from "@/lib/actions/media";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.media.findUnique);
const mockUpdate = vi.mocked(prisma.media.update);
const mockFetchTmdbDetails = vi.mocked(fetchTmdbDetails);

function mockMedia(row: { type: string; externalId: string | null; posterPath: string | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockFindUnique.mockResolvedValue(row as any);
}

describe("backfillPosterPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
  });

  it("returns an error when not authenticated", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockAuth.mockResolvedValue(null as any);
    const result = await backfillPosterPath("media-1");
    expect(result).toEqual({ status: "error", message: "Not authenticated" });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("skips when the media item already has a posterPath", async () => {
    mockMedia({ type: "movie", externalId: "550", posterPath: "/existing.jpg" });

    const result = await backfillPosterPath("media-1");
    expect(result).toEqual({ status: "skipped" });
    expect(mockFetchTmdbDetails).not.toHaveBeenCalled();
  });

  it("skips when there is no externalId to look up", async () => {
    mockMedia({ type: "movie", externalId: null, posterPath: null });

    const result = await backfillPosterPath("media-1");
    expect(result).toEqual({ status: "skipped" });
    expect(mockFetchTmdbDetails).not.toHaveBeenCalled();
  });

  it("fetches from TMDB (mapping movie/tv_show correctly) and persists the poster path", async () => {
    mockMedia({ type: "tv_show", externalId: "1396", posterPath: null });
    mockFetchTmdbDetails.mockResolvedValue({
      externalId: "1396",
      title: "Breaking Bad",
      year: 2008,
      type: "tv_show",
      posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      posterUrl: "https://image.tmdb.org/t/p/w185/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    });
    mockUpdate.mockResolvedValue({} as never);

    const result = await backfillPosterPath("media-1");

    expect(mockFetchTmdbDetails).toHaveBeenCalledWith("1396", "tv_show");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "media-1" },
      data: { posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" },
    });
    expect(result).toEqual({ status: "ok", posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" });
  });

  it("skips and does not persist when TMDB returns no posterPath", async () => {
    mockMedia({ type: "movie", externalId: "550", posterPath: null });
    mockFetchTmdbDetails.mockResolvedValue({
      externalId: "550",
      title: "Fight Club",
      year: 1999,
      type: "movie",
      posterPath: null,
      posterUrl: null,
    });

    const result = await backfillPosterPath("media-1");
    expect(result).toEqual({ status: "skipped" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects a malformed posterPath rather than persisting it", async () => {
    mockMedia({ type: "movie", externalId: "550", posterPath: null });
    mockFetchTmdbDetails.mockResolvedValue({
      externalId: "550",
      title: "Fight Club",
      year: 1999,
      type: "movie",
      posterPath: "javascript:alert(1)",
      posterUrl: null,
    });

    const result = await backfillPosterPath("media-1");
    expect(result).toEqual({ status: "skipped" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
