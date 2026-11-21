import Link from "next/link";

import { Logo } from "@/components/logo";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6 py-7 sm:px-10 lg:px-16">
        <Link href="/" className="flex items-center gap-2.5" aria-label="TrackXpense home">
          <Logo className="size-7 text-brand-deep" />
          <span className="font-bold tracking-tight">TrackXpense</span>
        </Link>
        <nav aria-label="Legal" className="flex gap-5 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
