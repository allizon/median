"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserList = {
  id: string;
  name: string;
  isDefaultWishlist: boolean;
  itemCount: number;
  hasItem: boolean;
};

export type AddToListResult =
  | { status: "added"; listName: string }
  | { status: "already_exists" }
  | { status: "error"; message: string };

// ── getUserLists ──────────────────────────────────────────────────────────────

/** Returns all lists the viewer owns, annotated with whether mediaId is in each. */
export async function getUserLists(mediaId: string): Promise<UserList[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const lists = await prisma.list.findMany({
    where: { ownerId: session.user.id },
    orderBy: [{ isDefaultWishlist: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      isDefaultWishlist: true,
      _count: { select: { items: true } },
      items: {
        where: { mediaId },
        select: { id: true },
        take: 1,
      },
    },
  });

  return lists.map((l) => ({
    id: l.id,
    name: l.name,
    isDefaultWishlist: l.isDefaultWishlist,
    itemCount: l._count.items,
    hasItem: l.items.length > 0,
  }));
}

// ── addToWishlist ─────────────────────────────────────────────────────────────

export async function addToWishlist(
  mediaId: string,
): Promise<AddToListResult> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  const wishlist = await prisma.list.findFirst({
    where: { ownerId: session.user.id, isDefaultWishlist: true },
    select: { id: true, name: true },
  });

  if (!wishlist) return { status: "error", message: "Wishlist not found" };

  const existing = await prisma.listItem.findFirst({
    where: { listId: wishlist.id, mediaId },
    select: { id: true },
  });

  if (existing) return { status: "already_exists" };

  await prisma.listItem.create({
    data: { listId: wishlist.id, mediaId, addedById: session.user.id },
  });

  return { status: "added", listName: wishlist.name };
}

// ── addToList ─────────────────────────────────────────────────────────────────

export async function addToList(
  listId: string,
  mediaId: string,
): Promise<AddToListResult> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  const parsed = z.object({ listId: z.string().cuid(), mediaId: z.string().cuid() })
    .safeParse({ listId, mediaId });
  if (!parsed.success) return { status: "error", message: "Invalid input" };

  // Verify the list belongs to the user
  const list = await prisma.list.findFirst({
    where: { id: listId, ownerId: session.user.id },
    select: { id: true, name: true },
  });

  if (!list) return { status: "error", message: "List not found" };

  const existing = await prisma.listItem.findFirst({
    where: { listId, mediaId },
    select: { id: true },
  });

  if (existing) return { status: "already_exists" };

  await prisma.listItem.create({
    data: { listId, mediaId, addedById: session.user.id },
  });

  return { status: "added", listName: list.name };
}

// ── createListAndAdd ──────────────────────────────────────────────────────────

export async function createListAndAdd(
  name: string,
  mediaId: string,
): Promise<AddToListResult> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  const parsed = z
    .object({ name: z.string().min(1).max(200), mediaId: z.string().cuid() })
    .safeParse({ name, mediaId });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };

  const list = await prisma.list.create({
    data: {
      name: parsed.data.name,
      ownerId: session.user.id,
      visibility: "private",
      isDefaultWishlist: false,
      items: {
        create: { mediaId: parsed.data.mediaId, addedById: session.user.id },
      },
    },
    select: { name: true },
  });

  return { status: "added", listName: list.name };
}
