/**
 * The ledger owner used when nobody signs in.
 *
 * Kept in its own import-free module because two very different callers need to
 * agree on it: the identity seam in `actions/lib/checkUser.ts`, and
 * `scripts/seed-demo.ts`, which runs under plain node and cannot pull in the
 * app's database or Clerk graph. A mismatch would silently seed an empty ledger.
 */
export const DEMO_CLERK_USER_ID = "local-demo";

export const DEMO_USER_PROFILE = {
  clerkUserId: DEMO_CLERK_USER_ID,
  email: "ledger@trackxpense.local",
  name: "Alex Mercer",
};
