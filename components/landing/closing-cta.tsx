import Link from "next/link";

import { DotPattern } from "@/components/ambient";
import { Button } from "@/components/ui/button";

/**
 * The last ask is small on purpose: open the ledger, write one line. It is the
 * whole product in one action, and it is true — that is all the app does.
 */
function ClosingCta() {
  return (
    <section id="start" className="container mx-auto px-4 pb-24 md:pb-32">
      <div className="relative isolate overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] md:px-12 md:py-24">
        <div
          aria-hidden
          className="--dot-grid pointer-events-none absolute inset-0 opacity-[0.14] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_40%,transparent_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[110px]"
        />

        <div className="relative mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tighter text-balance text-paper md:text-5xl">
            One line in the ledger before tonight&apos;s grocery run
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-paper/70">
            TrackXpense does not connect to a bank, import statements, or generate reports. It is a
            record you keep, and it asks for nothing else.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/transaction/create"
              className="transition-transform hover:-translate-y-0.5"
            >
              <Button
                size="lg"
                className="rounded-full bg-paper px-8 text-base text-ink hover:bg-paper/90 hover:text-ink"
              >
                Log tonight&apos;s shop
              </Button>
            </Link>
            <Link href="/dashboard" className="transition-transform hover:-translate-y-0.5">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-paper/30 bg-transparent px-8 text-base text-paper hover:bg-paper/10 hover:text-paper"
              >
                I already track here
              </Button>
            </Link>
          </div>

          <p className="mt-8 font-mono text-xs tabular-nums text-paper/50">
            Two accounts &middot; twenty-one categories &middot; zero bank connections
          </p>
        </div>
      </div>
    </section>
  );
}

export default ClosingCta;
