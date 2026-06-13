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
function mapResult(r: any): TmdbResult {
  const isMovie = r.media_type === "movie";
  const posterPath: string | null = r.poster_path ?? null;
  return {
    externalId: String(r.id),
    title: isMovie ? String(r.title) : String(r.name),
    year: parseYear(isMovie ? r.release_date : r.first_air_date),
    type: isMovie ? "movie" : "tv_show",
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
    .map(mapResult);
}
