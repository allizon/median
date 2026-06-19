"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MediaType, type Media } from "@prisma/client";
import { searchTmdb as fetchFromTmdb, fetchTmdbDetails, type TmdbResult } from "@/lib/tmdb";

export type { TmdbResult } from "@/lib/tmdb";

// ── Schemas ──────────────────────────────────────────────────────────────────

const seasonRowSchema = z.object({
  number: z.coerce.number().int().positive(),
  title: z.string().optional(),
});

// TMDB poster paths look like "/abc123XYZ.jpg" — guard against persisting anything else.
const TMDB_POSTER_PATH_RE = /^\/[\w-]+\.(jpg|jpeg|png)$/i;

const createMediaSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  type: z.nativeEnum(MediaType),
  year: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int().min(1800).max(2200).optional(),
  ),
  creator: z.string().max(500).optional(),
  seasons: z.array(seasonRowSchema).optional(),
  externalId: z.string().optional(),
  posterPath: z.string().regex(TMDB_POSTER_PATH_RE, "Invalid poster path").optional(),
});

// Raw form values (year is a string from the input element)
export type CreateMediaInput = {
  title: string;
  type: MediaType;
  year?: string | number;
  creator?: string;
  seasons?: { number: number; title?: string }[];
  externalId?: string;
  posterPath?: string;
};

export type DuplicateCandidate = {
  id: string;
  title: string;
  year: number | null;
  creator: string | null;
  type: MediaType;
};

export type CreateMediaResult =
  | { status: "created"; mediaId: string }
  | { status: "duplicates"; candidates: DuplicateCandidate[] }
  | { status: "error"; message: string };

// ── Duplicate check ───────────────────────────────────────────────────────────

export async function checkMediaDuplicates(
  title: string,
  type: MediaType,
): Promise<DuplicateCandidate[]> {
  try {
    const results = await prisma.media.findMany({
      where: {
        type,
        title: { contains: title, mode: "insensitive" },
      },
      select: { id: true, title: true, year: true, creator: true, type: true },
      take: 5,
    });
    return results;
  } catch {
    return [];
  }
}

// ── Create media item ─────────────────────────────────────────────────────────

export async function createMedia(
  input: CreateMediaInput,
  force = false,
): Promise<CreateMediaResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "error", message: "Not authenticated" };
  }

  const parsed = createMediaSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { title, type, year, creator, seasons, externalId, posterPath } = parsed.data;

  // Duplicate check unless user explicitly forced creation
  if (!force) {
    const candidates = await checkMediaDuplicates(title, type);
    if (candidates.length > 0) {
      return { status: "duplicates", candidates };
    }
  }

  let media: Media;
  try {
    media = await prisma.media.create({
      data: {
        title,
        type,
        year: year,
        creator: creator || null,
        externalId: externalId ?? null,
        posterPath: posterPath ?? null,
        createdById: session.user.id,
      },
    });

    if (seasons && seasons.length > 0) {
      await prisma.season.createMany({
        data: seasons.map((s) => ({
          mediaId: media.id,
          number: s.number,
          title: s.title || null,
        })),
        skipDuplicates: true,
      });
    }
  } catch {
    return { status: "error", message: "Failed to create media. Please try again." };
  }

  revalidatePath("/search");
  return { status: "created", mediaId: media.id };
}

// ── TMDB search ───────────────────────────────────────────────────────────────

export type TmdbSearchResult =
  | { status: "ok"; results: TmdbResult[] }
  | { status: "empty" }
  | { status: "error"; message: string };

export async function searchTmdb(query: string): Promise<TmdbSearchResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "error", message: "Not authenticated" };
  }

  const q = query.trim();
  if (!q) return { status: "empty" };

  try {
    const results = await fetchFromTmdb(q);
    if (results.length === 0) return { status: "empty" };
    return { status: "ok", results };
  } catch {
    return { status: "error", message: "Search failed. Please try again." };
  }
}

// ── searchCatalog ─────────────────────────────────────────────────────────────

export type CatalogResult = {
  id: string;
  title: string;
  type: MediaType;
  year: number | null;
  creator: string | null;
};

export async function searchCatalog(query: string): Promise<CatalogResult[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  try {
    return await prisma.media.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      orderBy: { title: "asc" },
      take: 20,
      select: { id: true, title: true, type: true, year: true, creator: true },
    });
  } catch {
    return [];
  }
}

// ── Poster backfill ───────────────────────────────────────────────────────────

export type BackfillPosterResult =
  | { status: "ok"; posterPath: string }
  | { status: "skipped" }
  | { status: "error"; message: string };

export async function backfillPosterPath(mediaId: string): Promise<BackfillPosterResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "error", message: "Not authenticated" };
  }

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { type: true, externalId: true, posterPath: true },
  });
  if (!media) {
    return { status: "error", message: "Not found" };
  }

  // Already has a poster, or nothing to look up against.
  if (media.posterPath || !media.externalId) {
    return { status: "skipped" };
  }

  const details = await fetchTmdbDetails(
    media.externalId,
    media.type === "movie" ? "movie" : "tv_show",
  );
  if (!details?.posterPath || !TMDB_POSTER_PATH_RE.test(details.posterPath)) {
    return { status: "skipped" };
  }

  try {
    await prisma.media.update({
      where: { id: mediaId },
      data: { posterPath: details.posterPath },
    });
  } catch {
    return { status: "error", message: "Failed to save poster. Please try again." };
  }

  revalidatePath(`/media/${mediaId}`);
  return { status: "ok", posterPath: details.posterPath };
}
