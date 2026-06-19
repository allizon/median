import type { PrismaClient, MediaType } from "@prisma/client";

export class MediaRepository {
  constructor(private prisma: PrismaClient) {}

  async findDuplicates(title: string, type: MediaType) {
    return this.prisma.media.findMany({
      where: {
        type,
        title: { contains: title, mode: "insensitive" },
      },
      select: { id: true, title: true, year: true, creator: true, type: true },
      take: 5,
    });
  }

  async createMedia(data: {
    title: string;
    type: MediaType;
    year?: number | null;
    creator?: string | null;
    externalId?: string | null;
    posterPath?: string | null;
    createdById: string;
  }) {
    return this.prisma.media.create({ data });
  }

  async createSeasons(
    mediaId: string,
    seasons: { number: number; title?: string | null }[],
  ) {
    return this.prisma.season.createMany({
      data: seasons.map((s) => ({
        mediaId,
        number: s.number,
        title: s.title ?? null,
      })),
      skipDuplicates: true,
    });
  }

  async searchCatalog(query: string) {
    return this.prisma.media.findMany({
      where: { title: { contains: query, mode: "insensitive" } },
      orderBy: { title: "asc" },
      take: 20,
      select: { id: true, title: true, type: true, year: true, creator: true },
    });
  }

  async findPaginated(where: object, skip: number, take?: number) {
    return this.prisma.media.findMany({
      where,
      select: {
        id: true,
        title: true,
        year: true,
        creator: true,
        type: true,
      },
      orderBy: { title: "asc" },
      ...(take !== undefined ? { take } : {}),
      skip,
    });
  }

  async count(where: object) {
    return this.prisma.media.count({ where });
  }

  async findUnique(id: string) {
    return this.prisma.media.findUnique({
      where: { id },
      select: { type: true, externalId: true, posterPath: true },
    });
  }

  async updatePoster(id: string, posterPath: string) {
    return this.prisma.media.update({
      where: { id },
      data: { posterPath },
    });
  }

  async findWishlistItems(ownerId: string, mediaIds: string[]) {
    return this.prisma.listItem.findMany({
      where: {
        list: { ownerId, isDefaultWishlist: true },
        mediaId: { in: mediaIds },
      },
      select: { mediaId: true },
    });
  }
}
