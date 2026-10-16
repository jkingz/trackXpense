"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

import { LiveLedger } from "@/components/landing/live-ledger";
import { BrandGlow, DotPattern } from "@/components/ambient";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "center center"],
  });

  // The ledger arrives flat and lifts into place as the page settles under it.
  const rotateX = useTransform(scrollYProgress, [0, 1], [12, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const panelStyle = reduceMotion ? undefined : { rotateX, scale };

  return (
    <section id="top" className="relative isolate overflow-hidden">
      <DotPattern className="opacity-60" fade="ellipse" />
      <BrandGlow className="top-24 right-[-6rem] opacity-50" />

      <div className="container relative mx-auto grid grid-cols-1 items-center gap-x-10 gap-y-16 px-4 py-16 md:py-24 lg:grid-cols-12 lg:py-32">
        <div className="lg:col-span-6 lg:col-start-1">
          <h1 className="max-w-[15ch] text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.95] tracking-tighter text-balance text-foreground">
            Log the expense. <span className="--gradient-title">Watch the balance move.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            A two-account ledger you fill in yourself. One entry, one category, and the running
            balance and budget headroom on your dashboard change the moment you save it.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="transition-transform hover:-translate-y-0.5">
              <Button size="lg" className="rounded-full px-8 text-base">
                Open the ledger
              </Button>
            </Link>
            <Link
              href="/transaction/create"
              className="transition-transform hover:-translate-y-0.5"
            >
              <Button
                size="lg"
                variant="outline"
                className="glass-panel rounded-full px-8 text-base"
              >
                Log an entry
              </Button>
            </Link>
          </div>

          <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>No bank to connect</span>
            <span aria-hidden className="text-border">
              /
            </span>
            <span>Nothing to import</span>
            <span aria-hidden className="text-border">
              /
            </span>
            <span>Free while it is small</span>
          </p>
        </div>

        <div
          ref={stageRef}
          className="--capture-stage relative z-10 lg:col-span-6 lg:col-start-7 lg:mt-20 xl:mt-28"
        >
          <motion.div style={panelStyle} className="relative">
            <LiveLedger />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
