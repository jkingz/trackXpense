import { SignOutButton } from "@/components/sign-out-button";
import Link from "next/link";
import { Suspense } from "react";

import { currentUser } from "@/actions/lib/checkUser";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const landingLinks = [
  { label: "What's inside", href: "/#inside" },
  { label: "How it works", href: "/#flow" },
  { label: "Categories", href: "/#categories" },
];

/**
 * Placeholder for the auth-aware slot. It mirrors the real geometry (a single
 * icon button) so the bar never reflows when the database answers.
 */
function AuthSlotSkeleton() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <Skeleton className="size-8 rounded-md" />
    </div>
  );
}

/**
 * Reads the signed-in state and provisions the ledger row. This is the only part
 * of the header that touches the database, so it is the only part that is
 * suspended — the bar itself paints immediately.
 */
async function AuthSlot() {
  const user = await currentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/sign-in">
          <Button variant="ghost" size="sm" className="px-3">
            Sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignOutButton />
    </div>
  );
}

async function NavLinks() {
  const user = await currentUser();
  if (user) return null;
  return (
    <div className="hidden items-center gap-1 lg:flex">
      {landingLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl supports-backdrop-filter:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between gap-6 px-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="TrackXpense home"
        >
          <Logo className="size-7 text-brand-deep transition-colors group-hover:text-foreground" />
          {/* The wordmark is the first thing to go when the bar runs out of room:
            the icon plus the two CTAs plus the toggle do not fit at 390px. */}
          <span className="hidden text-base font-bold tracking-tight text-foreground sm:inline">
            TrackXpense
          </span>
        </Link>

        <Suspense fallback={null}>
          <NavLinks />
        </Suspense>

        <div className="flex items-center gap-2">
          {/* Suspense boundary for AuthSlot - allows non-blocking render */}
          <Suspense fallback={<AuthSlotSkeleton />}>
            <AuthSlot />
          </Suspense>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
