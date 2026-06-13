import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "@/lib/env";

declare global {
  var prisma: PrismaClient | undefined;
}

function createMissingDatabaseProxy() {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          "DATABASE_URL is not configured. Set it before using database-backed routes.",
        );
      },
    },
  ) as PrismaClient;
}

function createPrismaClient() {
  if (!env.DATABASE_URL) {
    return createMissingDatabaseProxy();
  }

  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && env.DATABASE_URL) {
  global.prisma = prisma;
}
