import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ClosingCta() {
  return (
    <section id="start" aria-labelledby="start-title" className="bg-accent">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10 md:py-24 lg:px-16">
        <h2
          id="start-title"
          className="text-4xl leading-none font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
        >
          It all adds up.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Keep the small purchases in view alongside the big ones.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/transaction/create"
            className={cn(buttonVariants(), "min-h-13 rounded-full px-6 text-base font-bold")}
          >
            Log an expense
          </Link>
          <Link
            href="/dashboard"
            className="py-3 font-bold text-primary underline underline-offset-4"
          >
            Open your ledger
          </Link>
        </div>
      </div>
    </section>
  );
}
