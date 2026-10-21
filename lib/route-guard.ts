/**
 * Where a request may go before any page renders.
 *
 * Kept as a pure function so the routing rules can be tested without a session
 * or a framework: the proxy only supplies the pathname and whether a valid
 * session exists.
 */

/** Routes that require a session. Everything else is public. */
const PROTECTED = /^\/(dashboard|account|transaction)(\/|$)/;

/** The marketing page. A signed-in visitor is sent to the ledger instead. */
const LANDING = /^\/$/;

/**
 * `allow` renders the route, `sign-in` sends an anonymous visitor to the
 * login page, and `dashboard` sends a signed-in visitor away from the landing
 * page so it is not reachable once they have a ledger.
 */
export type RouteDecision = "allow" | "sign-in" | "dashboard";

/** True when the pathname needs a session lookup at all. */
export function isGuardedPath(pathname: string): boolean {
  return PROTECTED.test(pathname) || LANDING.test(pathname);
}

export function routeDecision(pathname: string, signedIn: boolean): RouteDecision {
  if (LANDING.test(pathname)) return signedIn ? "dashboard" : "allow";
  if (PROTECTED.test(pathname)) return signedIn ? "allow" : "sign-in";
  return "allow";
}
