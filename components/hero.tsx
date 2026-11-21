import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { DemoButton } from "@/components/landing/demo-button";
import { PocketLogFigure } from "@/components/landing/pocket-log-figure";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HeroSection() {
  return (
    <section className="relative isolate overflow-clip">
      <div aria-hidden className="landing-water" />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-6 pt-12 pb-14 sm:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:px-16 lg:py-24">
        <div>
          <h1 className="max-w-xl text-[clamp(3rem,7vw,6.25rem)] leading-[0.93] font-extrabold tracking-[-0.075em]">
            <span className="block">Know where</span> <span className="block">your money</span>{" "}
            <span className="block">went.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Log everyday spending, see what’s left in your budget, and keep checking and savings in
            view.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <DemoButton />
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ variant: "link" }), "min-h-12 px-0 text-base")}
            >
              Create an account <ArrowUpRight aria-hidden />
            </Link>
          </div>
        </div>
        <PocketLogFigure />
      </div>
    </section>
  );
}
