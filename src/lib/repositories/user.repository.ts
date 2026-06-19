import type { PrismaClient } from "@prisma/client";

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findUnique(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findFirstForSignup(username: string, email: string) {
    return this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { username: true, email: true },
    });
  }

  async findUniqueByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        showInProgressOnProfile: true,
        createdAt: true,
      },
    });
  }

  async createWithDefaultList(data: {
    username: string;
    email: string;
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data: {
        ...data,
        ownedLists: {
          create: {
            name: "Wishlist",
            isDefaultWishlist: true,
            visibility: "private",
          },
        },
      },
    });
  }

  async findFirstByUsernameExcludingId(username: string, excludeId: string) {
    return this.prisma.user.findFirst({
      where: { username, id: { not: excludeId } },
      select: { id: true },
    });
  }

  async update(
    id: string,
    data: {
      username: string;
      displayName: string | null;
      showInProgressOnProfile: boolean;
    },
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { username: true },
    });
  }
}
