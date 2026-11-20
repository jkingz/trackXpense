import { Check } from "lucide-react";

import { PocketLogFigure } from "@/components/landing/pocket-log-figure";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HeroSection() {
  return (
    <section
      id="top"
      aria-labelledby="landing-title"
      className="mx-auto grid w-full max-w-7xl items-center gap-10 px-6 py-12 sm:px-10 md:grid-cols-[1fr_1.08fr] md:gap-8 md:py-20 lg:gap-16 lg:px-16 lg:py-24"
    >
      <div>
        <h1
          id="landing-title"
          className="text-5xl leading-[0.93] font-bold tracking-tighter sm:text-6xl md:text-5xl lg:text-6xl xl:text-[5.25rem]"
        >
          Spend it.
          <br />
          Log it.
          <br />
          Get on with it.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
          From a coffee to the weekly shop, record the little things as they happen. Your balance
          and budget update when you save.
        </p>
        <a
          href="#flow"
          className={cn(buttonVariants(), "mt-7 min-h-13 rounded-full px-6 text-base font-bold")}
        >
          See how to log an expense
        </a>
      </div>

      <PocketLogFigure>
        <div className="relative isolate grid min-h-92 place-items-center overflow-hidden rounded-3xl rounded-br-[4.5rem] bg-pocket-stage px-8 py-9 sm:px-10 lg:min-h-118 lg:rounded-br-[7rem]">
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/4 -right-2/3 -z-10 aspect-square w-[125%] rounded-full border border-pocket-orbit outline outline-offset-[2.25rem] outline-pocket-orbit after:absolute after:-inset-18 after:rounded-full after:border after:border-pocket-orbit"
          />

          <div
            data-pocket-receipt
            className="w-full max-w-72 -rotate-7 rounded-2xl border border-pocket-shadow bg-pocket-slip p-4 text-pocket-ink shadow-pocket-entry sm:mr-10 sm:p-5"
          >
            <div className="flex items-center justify-between gap-2 border-b border-pocket-slip-rule pb-3">
              <strong>Add an expense</strong>
              <span className="text-xs">Example</span>
            </div>
            <p className="py-3 font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              ₱180
            </p>
            <dl className="text-sm">
              <div className="flex justify-between gap-2 border-t border-pocket-slip-rule py-2">
                <dt>What for</dt>
                <dd className="font-bold">Weekend coffee</dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-pocket-slip-rule py-2">
                <dt>Category</dt>
                <dd className="font-bold">Food</dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-pocket-slip-rule py-2">
                <dt>Account</dt>
                <dd className="font-bold">Current</dd>
              </div>
            </dl>
          </div>

          <div
            data-pocket-badge
            className="absolute right-5 bottom-9 rotate-7 rounded-lg border border-pocket-shadow bg-pocket-saved px-4 py-3 text-pocket-ink shadow-pocket-confirmation sm:right-8 lg:bottom-16"
          >
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Check aria-hidden className="size-4" />
              Expense saved
            </p>
            <p className="text-xs">
              New balance <span className="font-mono tabular-nums">₱18,450</span>
            </p>
          </div>
        </div>
        <figcaption className="mt-3 text-sm text-muted-foreground">
          Example expense and its updated account balance
        </figcaption>
      </PocketLogFigure>
    </section>
  );
}
