import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { cache } from "react";

import { DEMO_USER_PROFILE } from "@/lib/demo-identity";
import { db } from "@/lib/prisma";

/**
 * The identity every read and write attaches to.
 *
 * A sign-in is no longer forced: a request with no Clerk session resolves the
 * same local ledger owner, so /dashboard, /account/[id] and every server action
 * work on a first visit. A real Clerk session still wins when one exists, so
 * restoring the wall means deleting the fallback below — every caller already
 * treats a thrown error as "not allowed in".
 *
 * Cached per request: a page that reads accounts and budget makes one users-row
 * query, not two.
 */
async function localUser() {
  const where = { clerkUserId: DEMO_USER_PROFILE.clerkUserId };

  // Read first, create only if the row is missing. An unconditional upsert makes the
  // Prisma client compute the `id` default — crypto.randomUUID() — even when the row
  // already exists (measured: findUnique 0 calls, upsert on an existing row 1 call),
  // and Cache Components refuses an unstable value during the prerender pass, which
  // costs the whole page an error boundary instead of the ledger.
  const existing = await db.user.findUnique({ where });
  if (existing) return existing;

  try {
    return await db.user.create({ data: DEMO_USER_PROFILE });
  } catch (error) {
    // Two concurrent first visits: the loser of the unique race re-reads the winner's
    // row instead of surfacing a write error.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return db.user.findUniqueOrThrow({ where });
    }
    throw error;
  }
}

export const checkUser = cache(async () => {
  const { userId } = await auth();

  if (!userId) return localUser();

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");
  return user;
});
