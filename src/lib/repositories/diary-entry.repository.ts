import type { PrismaClient } from "@prisma/client";

export class DiaryEntryRepository {
  constructor(private prisma: PrismaClient) {}

  async getFinishedCountsByType(userId: string) {
    return this.prisma.$queryRaw<{ type: string; count: number }[]>`
      SELECT m.type, COUNT(*)::int as count
      FROM "DiaryEntry" de
      JOIN "Media" m ON m.id = de."mediaId"
      WHERE de."userId" = ${userId}
        AND de.status = 'finished'
        AND de."seasonId" IS NULL
      GROUP BY m.type
    `;
  }

  async getAverageRating(userId: string) {
    const result = await this.prisma.diaryEntry.aggregate({
      where: {
        userId,
        status: "finished",
        seasonId: null,
        rating: { not: null },
      },
      _avg: { rating: true },
    });
    return result._avg.rating;
  }

  async getInProgressCount(userId: string) {
    return this.prisma.diaryEntry.count({
      where: {
        userId,
        status: "in_progress",
        seasonId: null,
      },
    });
  }
}
