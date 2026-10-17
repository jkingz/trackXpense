import { NextResponse, type NextRequest } from "next/server";

// Cheap gate: a missing session cookie redirects before any page renders.
// Cookie presence is not proof of a session; actions/lib/checkUser.ts validates it.
const PROTECTED = /^\/(dashboard|account|transaction)(\/|$)/;

export default function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("better-auth.session_token");
  if (!hasSession && PROTECTED.test(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
