import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Prisma 7 requires a driver adapter; the client no longer opens its own connection.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const db = globalThis.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
