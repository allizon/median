import type { PrismaClient } from "@prisma/client";
import type { ListVisibility } from "@prisma/client";

export class ListRepository {
  constructor(private prisma: PrismaClient) {}

  async findOwnerLists(ownerId: string, mediaId: string) {
    return this.prisma.list.findMany({
      where: { ownerId },
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
  }

  async findDefaultWishlist(ownerId: string) {
    return this.prisma.list.findFirst({
      where: { ownerId, isDefaultWishlist: true },
      select: { id: true, name: true },
    });
  }

  async findListItem(listId: string, mediaId: string) {
    return this.prisma.listItem.findFirst({
      where: { listId, mediaId },
      select: { id: true },
    });
  }

  async createListItem(data: {
    listId: string;
    mediaId: string;
    addedById: string;
  }) {
    return this.prisma.listItem.create({ data });
  }

  async findListByIdForOwner(id: string, ownerId: string) {
    return this.prisma.list.findFirst({
      where: { id, ownerId },
      select: { id: true, name: true, isDefaultWishlist: true },
    });
  }

  async findListForUpdate(id: string, ownerId: string) {
    return this.prisma.list.findFirst({
      where: { id, ownerId },
      select: { isDefaultWishlist: true },
    });
  }

  async createList(data: {
    ownerId: string;
    name: string;
    visibility: ListVisibility;
  }) {
    return this.prisma.list.create({
      data: {
        name: data.name,
        visibility: data.visibility,
        ownerId: data.ownerId,
        isDefaultWishlist: false,
      },
      select: { id: true, name: true },
    });
  }

  async updateList(id: string, data: { name?: string; visibility?: ListVisibility }) {
    return this.prisma.list.update({ where: { id }, data });
  }

  async deleteList(id: string) {
    return this.prisma.list.delete({ where: { id } });
  }

  async findListItemWithOwner(listItemId: string, ownerId: string) {
    return this.prisma.listItem.findFirst({
      where: { id: listItemId, list: { ownerId } },
      select: { id: true, listId: true },
    });
  }

  async deleteListItem(id: string) {
    return this.prisma.listItem.delete({ where: { id } });
  }

  async upsertListItemScore(data: {
    listItemId: string;
    userId: string;
    score: number;
  }) {
    return this.prisma.listItemScore.upsert({
      where: {
        listItemId_userId: {
          listItemId: data.listItemId,
          userId: data.userId,
        },
      },
      create: data,
      update: { score: data.score },
    });
  }

  async deleteListItemScore(listItemId: string, userId: string) {
    return this.prisma.listItemScore.deleteMany({
      where: { listItemId, userId },
    });
  }

  async createListAndAdd(data: {
    name: string;
    ownerId: string;
    mediaId: string;
    addedById: string;
  }) {
    return this.prisma.list.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
        visibility: "private",
        isDefaultWishlist: false,
        items: {
          create: { mediaId: data.mediaId, addedById: data.addedById },
        },
      },
      select: { name: true },
    });
  }

  async findFeaturedLists(
    ownerId: string,
    visibility: ListVisibility | { in: ListVisibility[] },
  ) {
    return this.prisma.list.findMany({
      where: {
        ownerId,
        featuredOnProfile: true,
        visibility,
      },
      orderBy: { profilePosition: "asc" },
      select: {
        id: true,
        name: true,
        isDefaultWishlist: true,
        visibility: true,
        featuredOnProfile: true,
        profilePosition: true,
        _count: { select: { items: true } },
        items: {
          take: 5,
          orderBy: { addedAt: "asc" },
          select: {
            media: {
              select: { id: true, title: true, type: true, posterPath: true, externalId: true },
            },
          },
        },
      },
    });
  }

  async findAllOwnerLists(ownerId: string) {
    return this.prisma.list.findMany({
      where: { ownerId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        isDefaultWishlist: true,
        visibility: true,
        featuredOnProfile: true,
        profilePosition: true,
        _count: { select: { items: true } },
        items: {
          take: 5,
          orderBy: { addedAt: "asc" },
          select: {
            media: {
              select: { id: true, title: true, type: true, posterPath: true, externalId: true },
            },
          },
        },
      },
    });
  }

  async updateListFeatured(
    id: string,
    ownerId: string,
    data: { featuredOnProfile: boolean; profilePosition: number | null },
  ) {
    return this.prisma.list.updateMany({
      where: { id, ownerId },
      data,
    });
  }
}
