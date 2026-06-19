import type { PrismaClient } from "@prisma/client";

export class ProfileRepository {
  constructor(private prisma: PrismaClient) {}

  async getViewerRole(viewerId: string | null, profileUserId: string): Promise<ViewerRole> {
    if (!viewerId) return "logged-out";
    if (viewerId === profileUserId) return "owner";

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: "accepted",
        OR: [
          { requesterId: viewerId, addresseeId: profileUserId },
          { requesterId: profileUserId, addresseeId: viewerId },
        ],
      },
    });

    return friendship ? "friend" : "stranger";
  }

  async getFriendshipState(viewerId: string, profileUserId: string) {
    return this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: viewerId, addresseeId: profileUserId },
          { requesterId: profileUserId, addresseeId: viewerId },
        ],
      },
    });
  }
}

export type ViewerRole = "owner" | "friend" | "stranger" | "logged-out";
