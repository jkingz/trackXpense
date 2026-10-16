"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Every figure here is read out of the code, not marketing: the account types
 * from the Prisma enum, the category count from data/categories.ts, the fields
 * from the add-transaction form. The zero leads because it is the claim a bank
 * app can never make.
 */
const facts = [
  {
    value: 0,
    label: "Bank connections",
    prefix: "",
    suffix: "",
    note: "Nothing to link, nothing to revoke",
  },
  { value: 2, label: "Account types", prefix: "", suffix: "", note: "Current and Savings" },
  { value: 21, label: "Categories shipped", prefix: "", suffix: "", note: "6 income, 15 expense" },
  {
    value: 5,
    label: "Fields per entry",
    prefix: "",
    suffix: "",
    note: "Amount, type, category, date, note",
  },
];

function Fact({ fact, delay }: { fact: (typeof facts)[number]; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [shown, setShown] = useState(fact.value);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(fact.value);
      return;
    }

    const controls = animate(0, fact.value, {
      duration: 0.9,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setShown(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, fact.value, delay]);

  return (
    <div ref={ref} className="px-4 py-8 sm:px-6 lg:py-10">
      <p className="font-mono text-4xl font-bold tabular-nums tracking-tight text-foreground lg:text-5xl">
        {fact.prefix}
        {shown}
        {fact.suffix}
      </p>
      <p className="mt-3 text-sm font-medium text-foreground">{fact.label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{fact.note}</p>
    </div>
  );
}

/**
 * A statement header, not a row of feature cards: hairline rules carry the
 * structure because the subject is a ledger.
 */
export default function MetricsBand({ className }: { className?: string }) {
  return (
    <section
      aria-label="What the ledger is made of"
      className={cn("container mx-auto px-4", className)}
    >
      <div className="grid grid-cols-2 divide-x divide-y divide-border border-y border-border lg:grid-cols-4 lg:divide-y-0">
        {facts.map((fact, index) => (
          <Fact key={fact.label} fact={fact} delay={index * 0.08} />
        ))}
      </div>
    </section>
  );
}
