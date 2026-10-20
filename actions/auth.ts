"use server";

import { headers } from "next/headers";

import { neonAuth } from "@/lib/neon-auth";

/**
 * Clears the session server-side and returns. The client navigates with a full
 * page reload (`window.location.assign`) rather than the server-action
 * `redirect`: the router had prefetched the landing page while signed in, and a
 * client-side redirect served that stale payload — the bar kept showing the
 * ledger actions after sign-out. `revalidatePath("/", "layout")` fixes the cache
 * but hangs in this environment (Next 16), so the reload is the reliable path.
 */
export async function signOutAction() {
  await neonAuth.api.signOut({ headers: await headers() });
}
