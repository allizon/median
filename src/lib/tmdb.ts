const TMDB_BASE = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p";

export type TmdbResult = {
  externalId: string;
  title: string;
  year: number | null;
  type: "movie" | "tv_show";
  posterPath: string | null;
  posterUrl: string | null;
};

function parseYear(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const year = parseInt(dateStr.slice(0, 4), 10);
  return isNaN(year) ? null : year;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapResult(r: any, type: "movie" | "tv_show"): TmdbResult {
  const isMovie = type === "movie";
  const posterPath: string | null = r.poster_path ?? null;
  return {
    externalId: String(r.id),
    title: isMovie ? String(r.title) : String(r.name),
    year: parseYear(isMovie ? r.release_date : r.first_air_date),
    type,
    posterPath,
    posterUrl: posterPath ? `${POSTER_BASE}/w185${posterPath}` : null,
  };
}

export async function searchTmdb(query: string): Promise<TmdbResult[]> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return [];

  const url = `${TMDB_BASE}/search/multi?query=${encodeURIComponent(query)}&include_adult=false`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${key}`,
      accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: { results: any[] } = await res.json();

  return data.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => mapResult(r, r.media_type === "movie" ? "movie" : "tv_show"));
}

export async function fetchTmdbDetails(id: string, type: "movie" | "tv_show"): Promise<TmdbResult | null> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;

  const endpoint = type === "movie" ? "movie" : "tv";
  const url = `${TMDB_BASE}/${endpoint}/${id}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${key}`,
      accept: "application/json",
    },
  });
  if (!res.ok) return null;

  const data = await res.json();
  return mapResult(data, type);
}
