import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // During build time or when DATABASE_URL is not set, create a client
    // that will fail at query time (not at import/instantiation time).
    // We achieve this by using a placeholder URL; actual DB calls will fail
    // but the build itself will succeed.
    const adapter = new PrismaPg({ connectionString: "postgresql://placeholder" });
    return new PrismaClient({ adapter, log: ["query"] });
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter, log: ["query"] });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
