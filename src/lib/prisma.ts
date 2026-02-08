import { PrismaClient } from "../generated/prisma/index";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"], // opcjonalnie, żeby widzieć zapytania w konsoli
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
