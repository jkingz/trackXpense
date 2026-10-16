"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { howItWorksData } from "@/data/landing";
import { cn } from "@/lib/utils";

// Each card pins a little lower than the one before it, so the stack visibly
// builds as you scroll instead of sliding past.
const PIN = ["lg:top-28 lg:z-10", "lg:top-36 lg:z-20", "lg:top-44 lg:z-30"];

function FlowCard({
  step,
  index,
  reduceMotion,
}: {
  step: (typeof howItWorksData)[number];
  index: number;
  reduceMotion: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.93, 1]);

  return (
    <motion.li
      ref={ref}
      // Transform only. An opacity `initial` would ship this copy invisible to any
      // client that never hydrates, because the server render emits `initial`.
      initial={reduceMotion ? false : { y: 28 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-15% 0px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      // `scale` only: binding `y` here would fight the `initial`/`animate` pair above.
      style={reduceMotion ? undefined : { scale }}
      className={cn(
        "rounded-2xl border bg-card p-6 shadow-lg shadow-foreground/5 lg:sticky md:p-8",
        PIN[index],
      )}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          {step.title}
        </h3>
      </div>

      <p className="mt-3 max-w-lg text-muted-foreground">{step.description}</p>

      <dl className="mt-6 divide-y divide-dashed divide-border border-y border-dashed border-border">
        {step.fields.map((field) => (
          <div key={field} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-muted-foreground">{field}</dt>
            <dd className="font-mono text-xs uppercase tracking-[0.14em] text-brand-deep">
              required
            </dd>
          </div>
        ))}
      </dl>
    </motion.li>
  );
}

const LandingFlow = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = !!useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start center", "end center"],
  });
  const width = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="flow" className="px-4 py-24 md:py-32">
      <div
        ref={trackRef}
        className="container mx-auto grid grid-cols-1 gap-x-12 gap-y-16 lg:grid-cols-12"
      >
        <div className="lg:sticky lg:top-32 lg:col-span-5 lg:self-start">
          <h2 className="max-w-md text-3xl font-bold tracking-tighter text-balance text-foreground md:text-5xl">
            Three screens, in the same order, every time.
          </h2>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Nothing to configure first. No bank to connect, no statement to import, no categories to
            invent.
          </p>
          <div className="mt-10 h-1 w-full max-w-md overflow-hidden rounded-full bg-muted">
            <motion.div
              style={{ width: reduceMotion ? "100%" : width }}
              className="h-full bg-brand-deep"
            />
          </div>
          <p className="mt-4 font-mono text-xs tabular-nums text-muted-foreground">
            {howItWorksData.length} steps &middot; about a minute
          </p>
        </div>

        <ol className="space-y-6 lg:col-span-7 lg:space-y-10">
          {howItWorksData.map((step, index) => (
            <FlowCard key={step.title} step={step} index={index} reduceMotion={reduceMotion} />
          ))}
        </ol>
      </div>
    </section>
  );
};

export default LandingFlow;
