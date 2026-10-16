import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { LayoutDashboard, PenBox } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { checkUser } from "@/lib/checkUser";

const landingLinks = [
  { label: "What's inside", href: "/#inside" },
  { label: "How it works", href: "/#flow" },
  { label: "Categories", href: "/#categories" },
];

/**
 * Placeholder for the auth-aware slot. It mirrors the real geometry (two pills
 * plus an avatar) so the bar never reflows when the database answers.
 */
function AuthSlotSkeleton() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <Skeleton className="h-8 w-20 rounded-md" />
      <Skeleton className="h-8 w-28 rounded-md" />
      <Skeleton className="size-9 rounded-full" />
    </div>
  );
}

/**
 * Reads the signed-in state and provisions the ledger row. This is the only part
 * of the header that touches the database, so it is the only part that is
 * suspended — the bar itself paints immediately.
 */
async function AuthSlot() {
  await checkUser();

  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <SignInButton forceRedirectUrl="/dashboard">
          <Button variant="ghost" size="sm" className="px-3">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton forceRedirectUrl="/dashboard">
          <Button size="sm" className="px-4">
            Start tracking
          </Button>
        </SignUpButton>
      </Show>

      <Show when="signed-in">
        <Link
          href="/dashboard"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Button variant="outline" size="sm">
            <LayoutDashboard />
            <span className="hidden md:inline">Dashboard</span>
          </Button>
        </Link>
        <Link href="/transaction/create" className="transition-transform hover:-translate-y-0.5">
          <Button size="sm">
            <PenBox />
            <span className="hidden md:inline">Add Transaction</span>
          </Button>
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-9 rounded-full",
            },
          }}
        />
      </Show>
    </div>
  );
}

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between gap-6 px-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="TrackXpense home"
        >
          <Logo className="size-7 text-brand-deep transition-colors group-hover:text-foreground" />
          <span className="text-base font-bold tracking-tight text-foreground">TrackXpense</span>
        </Link>

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

        {/* Forced-login review: the sign-in / sign-up / user-button cluster is
            taken out of the bar. AuthSlot and AuthSlotSkeleton stay defined
            below, so restoring it is a one-line uncomment — and the bar no longer
            waits on the database to paint. */}
        {/* <Suspense fallback={<AuthSlotSkeleton />}>
          <AuthSlot />
        </Suspense> */}
      </nav>
    </header>
  );
};

export default Header;
