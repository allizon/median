import { describe, expect, it, vi, afterEach } from "vitest";
import { searchTmdb } from "@/lib/tmdb";

const MOVIE = {
  id: 550,
  media_type: "movie",
  title: "Fight Club",
  release_date: "1999-10-15",
  poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
};

const TV = {
  id: 1396,
  media_type: "tv",
  name: "Breaking Bad",
  first_air_date: "2008-01-20",
  poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
};

const PERSON = {
  id: 9999,
  media_type: "person",
  name: "Tom Hanks",
};

function mockFetch(results: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results }),
    }),
  );
}

describe("searchTmdb", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("maps a movie result correctly", async () => {
    vi.stubEnv("TMDB_API_KEY", "test-key");
    mockFetch([MOVIE]);
    const results = await searchTmdb("fight club");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      externalId: "550",
      title: "Fight Club",
      year: 1999,
      type: "movie",
      posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      posterUrl: "https://image.tmdb.org/t/p/w185/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    });
  });

  it("maps a TV result correctly, translating media_type tv → tv_show", async () => {
    vi.stubEnv("TMDB_API_KEY", "test-key");
    mockFetch([TV]);
    const results = await searchTmdb("breaking bad");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      externalId: "1396",
      title: "Breaking Bad",
      year: 2008,
      type: "tv_show",
      posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    });
  });

  it("filters out person results", async () => {
    vi.stubEnv("TMDB_API_KEY", "test-key");
    mockFetch([MOVIE, PERSON, TV]);
    const results = await searchTmdb("test");
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.type === "movie" || r.type === "tv_show")).toBe(true);
  });

  it("returns null posterPath and posterUrl when poster_path is absent", async () => {
    vi.stubEnv("TMDB_API_KEY", "test-key");
    mockFetch([{ ...MOVIE, poster_path: null }]);
    const results = await searchTmdb("fight club");
    expect(results[0].posterPath).toBeNull();
    expect(results[0].posterUrl).toBeNull();
  });

  it("parses year from release_date for movies", async () => {
    vi.stubEnv("TMDB_API_KEY", "test-key");
    mockFetch([{ ...MOVIE, release_date: "2024-03-15" }]);
    const results = await searchTmdb("test");
    expect(results[0].year).toBe(2024);
  });

  it("parses year from first_air_date for TV shows", async () => {
    vi.stubEnv("TMDB_API_KEY", "test-key");
    mockFetch([{ ...TV, first_air_date: "2022-11-01" }]);
    const results = await searchTmdb("test");
    expect(results[0].year).toBe(2022);
  });

  it("returns null year when date is empty string", async () => {
    vi.stubEnv("TMDB_API_KEY", "test-key");
    mockFetch([{ ...MOVIE, release_date: "" }]);
    const results = await searchTmdb("test");
    expect(results[0].year).toBeNull();
  });

  it("returns null year when date is absent", async () => {
    vi.stubEnv("TMDB_API_KEY", "test-key");
    const { release_date: _, ...noDate } = MOVIE;
    mockFetch([noDate]);
    const results = await searchTmdb("test");
    expect(results[0].year).toBeNull();
  });

  it("returns empty array when TMDB_API_KEY is not set", async () => {
    vi.stubEnv("TMDB_API_KEY", "");
    const results = await searchTmdb("test");
    expect(results).toHaveLength(0);
  });

  it("sends the API key as a Bearer token, not a query param", async () => {
    vi.stubEnv("TMDB_API_KEY", "test-key");
    mockFetch([MOVIE]);
    await searchTmdb("fight club");

    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url.toString()).not.toContain("api_key");
    expect(options?.headers).toMatchObject({ Authorization: "Bearer test-key" });
  });
});
