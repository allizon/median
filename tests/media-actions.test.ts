import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    media: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    season: {
      createMany: vi.fn(),
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
import { MediaType } from "@prisma/client";
import { backfillPosterPath, createMedia } from "@/lib/actions/media";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.media.findUnique);
const mockUpdate = vi.mocked(prisma.media.update);
const mockCreate = vi.mocked(prisma.media.create);
const mockFindMany = vi.mocked(prisma.media.findMany);
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

  it("returns an error when Prisma update fails", async () => {
    mockMedia({ type: "movie", externalId: "550", posterPath: null });
    mockFetchTmdbDetails.mockResolvedValue({
      externalId: "550",
      title: "Fight Club",
      year: 1999,
      type: "movie",
      posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      posterUrl: "https://image.tmdb.org/t/p/w185/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    });
    mockUpdate.mockRejectedValue(new Error("DB connection failed"));

    const result = await backfillPosterPath("media-1");

    expect(result).toEqual({ status: "error", message: "Failed to save poster. Please try again." });
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

describe("createMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
  });

  it("returns an error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);
    const result = await createMedia({ title: "Fight Club", type: MediaType.movie });
    expect(result).toEqual({ status: "error", message: "Not authenticated" });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns an error for invalid input", async () => {
    const result = await createMedia({ title: "", type: MediaType.movie } as never);
    expect(result).toEqual({ status: "error", message: "Title is required" });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns duplicates when matching items exist", async () => {
    const candidate = { id: "media-1", title: "Fight Club", year: 1999, creator: "David Fincher", type: MediaType.movie };
    mockFindMany.mockResolvedValue([candidate]);

    const result = await createMedia({ title: "Fight Club", type: MediaType.movie });

    expect(result).toEqual({ status: "duplicates", candidates: [candidate] });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns an error when Prisma create fails", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCreate.mockRejectedValue(new Error("DB connection failed"));

    const result = await createMedia({ title: "Fight Club", type: MediaType.movie });

    expect(result).toEqual({ status: "error", message: "Failed to create media. Please try again." });
  });

  it("creates a TV show with seasons and returns the new media id", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: "media-42" } as never);

    const result = await createMedia({
      title: "Breaking Bad",
      type: MediaType.tv_show,
      seasons: [{ number: 1 }, { number: 2 }],
    });

    expect(result).toEqual({ status: "created", mediaId: "media-42" });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: "Breaking Bad", type: MediaType.tv_show }),
      }),
    );
  });

  it("returns an error when Prisma season createMany fails", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: "media-42" } as never);
    const { prisma: prismaMock } = await import("@/lib/prisma");
    vi.mocked(prismaMock.season.createMany).mockRejectedValue(new Error("DB constraint"));

    const result = await createMedia({
      title: "Breaking Bad",
      type: MediaType.tv_show,
      seasons: [{ number: 1 }],
    });

    expect(result).toEqual({ status: "error", message: "Failed to create media. Please try again." });
  });

  it("rejects a posterPath that doesn't look like a TMDB path", async () => {
    const result = await createMedia({
      title: "Fight Club",
      type: MediaType.movie,
      externalId: "550",
      posterPath: "javascript:alert(1)",
    });

    expect(result.status).toBe("error");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("accepts a posterPath that matches the TMDB path format", async () => {
    mockFindMany.mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreate.mockResolvedValue({ id: "media-1" } as any);

    const result = await createMedia({
      title: "Fight Club",
      type: MediaType.movie,
      externalId: "550",
      posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    });

    expect(result).toEqual({ status: "created", mediaId: "media-1" });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" }),
      }),
    );
  });
});
