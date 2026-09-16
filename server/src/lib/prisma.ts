import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient — avoids exhausting the Postgres connection pool
// under tsx's watch-mode hot reload in development.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
