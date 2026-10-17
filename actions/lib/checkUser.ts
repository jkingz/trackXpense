import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { neonAuth } from "@/lib/neon-auth";
import { db } from "@/lib/prisma";

/** The signed-in user for this request, or null. Cached per request. */
export const currentUser = cache(async () => {
  const session = await neonAuth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.user.id } });
});

/**
 * The ledger owner every read and write attaches to. Throws when signed out, so
 * every action's catch turns it into "not allowed".
 */
export const checkUser = async () => {
  const user = await currentUser();
  if (!user) throw new Error("Sign in required");
  return user;
};

/**
 * The same guard for pages, where a thrown error is the wrong shape: a page
 * that cannot name an owner should send the visitor to sign-in, not render a
 * 500. `proxy.ts` only checks that a cookie exists, so a stale one still gets
 * this far.
 */
export const requireUser = async () => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  return user;
};
