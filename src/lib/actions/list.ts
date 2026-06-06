"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ListVisibility } from "@prisma/client";

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

// ── createList ────────────────────────────────────────────────────────────────

export type CreateListResult =
  | { status: "created"; id: string; name: string }
  | { status: "error"; message: string };

export async function createList(
  name: string,
  visibility: ListVisibility,
): Promise<CreateListResult> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  const parsed = z
    .object({ name: z.string().min(1).max(200), visibility: z.enum(["private", "public"]) })
    .safeParse({ name, visibility });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };

  const list = await prisma.list.create({
    data: {
      name: parsed.data.name,
      visibility: parsed.data.visibility,
      ownerId: session.user.id,
      isDefaultWishlist: false,
    },
    select: { id: true, name: true },
  });

  revalidatePath("/");
  return { status: "created", id: list.id, name: list.name };
}

// ── updateList ────────────────────────────────────────────────────────────────

export type UpdateListResult =
  | { status: "updated" }
  | { status: "error"; message: string };

export async function updateList(
  id: string,
  updates: { name?: string; visibility?: ListVisibility },
): Promise<UpdateListResult> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  const list = await prisma.list.findFirst({
    where: { id, ownerId: session.user.id },
    select: { isDefaultWishlist: true },
  });
  if (!list) return { status: "error", message: "List not found" };

  const parsed = z
    .object({
      name: z.string().min(1).max(200).optional(),
      visibility: z.enum(["private", "public"]).optional(),
    })
    .safeParse(updates);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };

  const data: { name?: string; visibility?: ListVisibility } = {};
  if (parsed.data.visibility !== undefined) data.visibility = parsed.data.visibility;
  if (parsed.data.name !== undefined && !list.isDefaultWishlist) data.name = parsed.data.name;

  await prisma.list.update({ where: { id }, data });

  revalidatePath("/");
  revalidatePath(`/lists/${id}`);
  return { status: "updated" };
}

// ── deleteList ────────────────────────────────────────────────────────────────

export type DeleteListResult =
  | { status: "deleted" }
  | { status: "error"; message: string };

export async function deleteList(id: string): Promise<DeleteListResult> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  const list = await prisma.list.findFirst({
    where: { id, ownerId: session.user.id },
    select: { isDefaultWishlist: true },
  });
  if (!list) return { status: "error", message: "List not found" };
  if (list.isDefaultWishlist) return { status: "error", message: "Cannot delete default Wishlist" };

  await prisma.list.delete({ where: { id } });

  revalidatePath("/");
  return { status: "deleted" };
}

// ── removeListItem ────────────────────────────────────────────────────────────

export type RemoveListItemResult =
  | { status: "removed" }
  | { status: "error"; message: string };

export async function removeListItem(listItemId: string): Promise<RemoveListItemResult> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  const item = await prisma.listItem.findFirst({
    where: { id: listItemId, list: { ownerId: session.user.id } },
    select: { id: true, listId: true },
  });
  if (!item) return { status: "error", message: "Item not found" };

  await prisma.listItem.delete({ where: { id: listItemId } });

  revalidatePath(`/lists/${item.listId}`);
  return { status: "removed" };
}

// ── setListItemScore ──────────────────────────────────────────────────────────

export type SetListItemScoreResult =
  | { status: "scored" }
  | { status: "error"; message: string };

export async function setListItemScore(
  listItemId: string,
  score: number,
): Promise<SetListItemScoreResult> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  const parsed = z
    .object({ listItemId: z.string().cuid(), score: z.number().int().min(0).max(4) })
    .safeParse({ listItemId, score });
  if (!parsed.success) return { status: "error", message: "Invalid input" };

  const item = await prisma.listItem.findFirst({
    where: { id: listItemId, list: { ownerId: session.user.id } },
    select: { id: true },
  });
  if (!item) return { status: "error", message: "Item not found" };

  await prisma.listItemScore.upsert({
    where: { listItemId_userId: { listItemId, userId: session.user.id } },
    create: { listItemId, userId: session.user.id, score: parsed.data.score },
    update: { score: parsed.data.score },
  });

  return { status: "scored" };
}

// ── clearListItemScore ────────────────────────────────────────────────────────

export type ClearListItemScoreResult =
  | { status: "cleared" }
  | { status: "error"; message: string };

export async function clearListItemScore(listItemId: string): Promise<ClearListItemScoreResult> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  const item = await prisma.listItem.findFirst({
    where: { id: listItemId, list: { ownerId: session.user.id } },
    select: { id: true },
  });
  if (!item) return { status: "error", message: "Item not found" };

  await prisma.listItemScore.deleteMany({
    where: { listItemId, userId: session.user.id },
  });

  return { status: "cleared" };
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
