import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ClosingCta() {
  return (
    <section
      id="start"
      aria-labelledby="start-title"
      className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-24"
    >
      <div className="flex flex-col items-start justify-between gap-8 rounded-tl-4xl rounded-br-4xl bg-landing-sage px-6 py-10 text-landing-ink sm:px-12 sm:py-14 md:flex-row md:items-center">
        <div>
          <h2
            id="start-title"
            className="text-4xl leading-none font-extrabold tracking-tighter sm:text-6xl"
          >
            Start with your next expense.
          </h2>
          <p className="mt-4 max-w-lg text-lg text-landing-ink/85">
            Create an account, add your first balance, and log what you spend next.
          </p>
        </div>
        <Link
          href="/sign-up"
          className={cn(
            buttonVariants(),
            "min-h-12 shrink-0 rounded-full bg-landing-ink px-6 text-base text-white hover:bg-landing-ink/90",
          )}
        >
          Create an account <ArrowUpRight aria-hidden data-icon="inline-end" />
        </Link>
      </div>
    </section>
  );
}
