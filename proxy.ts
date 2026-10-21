import { NextResponse, type NextRequest } from "next/server";

import { neonAuth } from "@/lib/neon-auth";
import { isGuardedPath, routeDecision } from "@/lib/route-guard";

// Better Auth prefixes its cookie with `__Secure-` whenever it is served over
// HTTPS, which is every deployed environment — so the deployed cookie name is
// `__Secure-better-auth.session_token` and the bare name below never matches.
// Both are checked; matching only the bare name bounced every signed-in
// visitor on a production host straight back to /sign-in.
const SESSION_COOKIES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

// Cheap gate: a missing session cookie skips the validation call. Cookie
// presence is not proof of a session; actions/lib/checkUser.ts validates it.
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isGuardedPath(pathname)) {
    return NextResponse.next();
  }

  const hasSessionCookie = SESSION_COOKIES.some((name) => request.cookies.has(name));
  // Validate the actual session, not just cookie presence, so expired/foreign
  // cookies fail closed here instead of reaching the app.
  const signedIn = hasSessionCookie
    ? Boolean(await neonAuth.api.getSession({ headers: request.headers }))
    : false;

  switch (routeDecision(pathname, signedIn)) {
    case "sign-in":
      return NextResponse.redirect(new URL("/sign-in", request.url));
    // The landing page is marketing: a signed-in visitor belongs in their
    // ledger, so the page is not reachable from either side of the logo.
    case "dashboard":
      return NextResponse.redirect(new URL("/dashboard", request.url));
    default:
      return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
