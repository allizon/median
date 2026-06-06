"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";

// ── Schemas ──────────────────────────────────────────────────────────────────

const seasonRowSchema = z.object({
  number: z.coerce.number().int().positive(),
  title: z.string().optional(),
});

const createMediaSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  type: z.nativeEnum(MediaType),
  year: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int().min(1800).max(2200).optional(),
  ),
  creator: z.string().max(500).optional(),
  seasons: z.array(seasonRowSchema).optional(),
});

// Raw form values (year is a string from the input element)
export type CreateMediaInput = {
  title: string;
  type: MediaType;
  year?: string | number;
  creator?: string;
  seasons?: { number: number; title?: string }[];
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
  const results = await prisma.media.findMany({
    where: {
      type,
      title: { contains: title, mode: "insensitive" },
    },
    select: { id: true, title: true, year: true, creator: true, type: true },
    take: 5,
  });
  return results;
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

  const { title, type, year, creator, seasons } = parsed.data;

  // Duplicate check unless user explicitly forced creation
  if (!force) {
    const candidates = await checkMediaDuplicates(title, type);
    if (candidates.length > 0) {
      return { status: "duplicates", candidates };
    }
  }

  const media = await prisma.media.create({
    data: {
      title,
      type,
      year: year,
      creator: creator || null,
      externalId: null,
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

  return { status: "created", mediaId: media.id };
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

  return prisma.media.findMany({
    where: { title: { contains: q, mode: "insensitive" } },
    orderBy: { title: "asc" },
    take: 20,
    select: { id: true, title: true, type: true, year: true, creator: true },
  });
}
